BEGIN TRANSACTION;
CREATE TABLE attractions (
	id INTEGER NOT NULL, 
	name VARCHAR(200), 
	city VARCHAR(50), 
	category VARCHAR(50), 
	description TEXT, 
	latitude FLOAT, 
	longitude FLOAT, 
	rating FLOAT, 
	recommended_duration INTEGER, 
	best_time_to_visit VARCHAR(100), 
	ticket_price FLOAT, 
	PRIMARY KEY (id)
);
CREATE TABLE itineraries (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	title VARCHAR(200), 
	days INTEGER, 
	budget FLOAT, 
	departure VARCHAR(100), 
	companion_type VARCHAR(50), 
	interests TEXT, 
	destinations TEXT, 
	travel_style VARCHAR(50), 
	start_date DATETIME, 
	end_date DATETIME, 
	status VARCHAR(20), 
	budget_breakdown TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE schedules (
	id INTEGER NOT NULL, 
	itinerary_id INTEGER, 
	day INTEGER, 
	period VARCHAR(20), 
	activity VARCHAR(500), 
	location VARCHAR(200), 
	latitude FLOAT, 
	longitude FLOAT, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(itinerary_id) REFERENCES itineraries (id)
);
CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR(50), 
	email VARCHAR(100), 
	password VARCHAR(255), 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'admin','admin@example.com','$2b$12$iVNyM7mP830jHhu/52KGmuNeWH70loLU.9QObPNN4jRH/Guv1WPsu','2026-02-07 12:17:31.639067');
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE INDEX ix_attractions_id ON attractions (id);
CREATE INDEX ix_attractions_name ON attractions (name);
CREATE INDEX ix_itineraries_id ON itineraries (id);
CREATE INDEX ix_schedules_id ON schedules (id);
COMMIT;
