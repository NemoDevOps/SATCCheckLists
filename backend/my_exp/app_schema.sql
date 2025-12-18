CREATE TABLE users (
	id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR, 
	telegram_id VARCHAR, 
	password VARCHAR NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE checklists (
	id INTEGER NOT NULL, 
	title VARCHAR NOT NULL, 
	description VARCHAR, 
	PRIMARY KEY (id)
);

CREATE TABLE checklist_items (
	id INTEGER NOT NULL, 
	checklist_id INTEGER NOT NULL, 
	position INTEGER NOT NULL, 
	text TEXT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(checklist_id) REFERENCES checklists (id)
);

CREATE TABLE reports (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	checklist_id INTEGER, 
	date_of_incident VARCHAR, 
	flight_number VARCHAR, 
	place VARCHAR, 
	time_of_incident VARCHAR, 
	items_checked_count INTEGER, 
	total_items INTEGER, 
	completed BOOLEAN, 
	comment TEXT, 
	date_report DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(checklist_id) REFERENCES checklists (id)
);

