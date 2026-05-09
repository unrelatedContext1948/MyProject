
CREATE TABLE UsersTable(
    UserID INT,
    Username TEXT,
    Password TEXT,
    JoinDate DATE,
    Role TEXT
)

CREATE TABLE PlaylistsTable(
    PlaylistID INT,
    Title VARCHAR(100),
    Channel TEXT,
    Duration TIME,
    SubmittedBy TEXT,
    VideoURL TEXT,
    StartTime TIME, 
    EndTime TIME
)

CREATE TABLE AdBreaksTable(
    AdBreakID INT PRIMARY KEY,
    AdBreakTitle TEXT,
    SubmittedBy TEXT,
    AdBreak URL,
    AdBreakText TEXT
)