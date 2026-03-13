"""
异步任务队列模块
支持后台任务处理，如行程生成、数据同步等
"""
import os
import uuid
import logging
import threading
import queue
import time
from typing import Callable, Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

TASK_QUEUE_ENABLED = os.getenv("TASK_QUEUE_ENABLED", "false").lower() == "true"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(int, Enum):
    HIGH = 0
    NORMAL = 5
    LOW = 10


@dataclass
class Task:
    id: str
    name: str
    func: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    priority: int = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: int = 0


class MemoryTaskQueue:
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self._queue = queue.PriorityQueue()
        self._tasks: Dict[str, Task] = {}
        self._workers: List[threading.Thread] = []
        self._running = False
        self._lock = threading.Lock()
    
    def start(self):
        self._running = True
        for i in range(self.max_workers):
            worker = threading.Thread(target=self._worker, daemon=True)
            worker.start()
            self._workers.append(worker)
        logger.info(f"任务队列已启动，工作线程数: {self.max_workers}")
    
    def stop(self):
        self._running = False
        for worker in self._workers:
            worker.join(timeout=1)
        self._workers.clear()
        logger.info("任务队列已停止")
    
    def submit(
        self,
        func: Callable,
        args: tuple = (),
        kwargs: dict = None,
        priority: int = TaskPriority.NORMAL,
        task_name: str = None
    ) -> str:
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            name=task_name or func.__name__,
            func=func,
            args=args,
            kwargs=kwargs or {},
            priority=priority
        )
        
        with self._lock:
            self._tasks[task_id] = task
        
        self._queue.put((priority, task.created_at.timestamp(), task))
        logger.info(f"任务已提交: {task.name} (ID: {task_id})")
        return task_id
    
    def get_task(self, task_id: str) -> Optional[Task]:
        return self._tasks.get(task_id)
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        task = self.get_task(task_id)
        if not task:
            return None
        
        return {
            "id": task.id,
            "name": task.name,
            "status": task.status.value,
            "progress": task.progress,
            "result": task.result,
            "error": task.error,
            "created_at": task.created_at.isoformat(),
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None
        }
    
    def cancel_task(self, task_id: str) -> bool:
        task = self.get_task(task_id)
        if task and task.status == TaskStatus.PENDING:
            task.status = TaskStatus.CANCELLED
            return True
        return False
    
    def get_stats(self) -> Dict:
        status_counts = {}
        for task in self._tasks.values():
            status = task.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "type": "memory",
            "running": self._running,
            "max_workers": self.max_workers,
            "total_tasks": len(self._tasks),
            "status_counts": status_counts
        }
    
    def _worker(self):
        while self._running:
            try:
                priority, timestamp, task = self._queue.get(timeout=1)
            except queue.Empty:
                continue
            
            if task.status == TaskStatus.CANCELLED:
                continue
            
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()
            logger.info(f"开始执行任务: {task.name}")
            
            try:
                result = task.func(*task.args, **task.kwargs)
                task.result = result
                task.status = TaskStatus.COMPLETED
                task.progress = 100
            except Exception as e:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                logger.error(f"任务执行失败: {task.name} - {e}")
            finally:
                task.completed_at = datetime.now()
                self._queue.task_done()


class AsyncTaskQueue:
    def __init__(self):
        self._memory_queue = MemoryTaskQueue()
        self._memory_queue.start()
    
    def submit(
        self,
        func: Callable,
        args: tuple = (),
        kwargs: dict = None,
        priority: int = TaskPriority.NORMAL,
        task_name: str = None
    ) -> str:
        return self._memory_queue.submit(func, args, kwargs, priority, task_name)
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        return self._memory_queue.get_task_status(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        return self._memory_queue.cancel_task(task_id)
    
    def get_stats(self) -> Dict:
        return self._memory_queue.get_stats()


task_queue = AsyncTaskQueue()


def get_task_queue() -> AsyncTaskQueue:
    return task_queue


def async_task(func):
    def wrapper(*args, **kwargs):
        task_id = task_queue.submit(func, args=args, kwargs=kwargs)
        return task_id
    return wrapper
