# Exam #N: "Exam Title"
## Student: s123456 LASTNAME FIRSTNAME 

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- POST `/api/something`
  - request parameters and request body content
  - response body content
- GET `/api/something`
  - request parameters
  - response body content
- POST `/api/something`
  - request parameters and request body content
  - response body content
- ...

## Database Tables

Table users - contains the registered users with their credentials (username and bcrypt-hashed password)
Table lines - contains the metro lines of the network (name)
Table stations - contains all the stations of the network (name)
Table line_stations - contains the associations between lines and stations, including the position of each station along the line; used to derive valid segments and interchange stations
Table events - contains the random events that can occur during a journey segment, each with a description and a coin effect (from -4 to +4)
Table games - contains all the games played by registered users, including the assigned start and end stations, the final score, and the timestamps of creation and completion
Table game_steps - contains the individual steps of each completed game, storing the from/to stations, the event that occurred, and the coin total after each step

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- username, password (plus any other requested info)
- username, password (plus any other requested info)

## Use of AI Tools
Briefly describe whether you used any AI tools (e.g., ChatGPT, GitHub Copilot, Claude) while working on this project, for which purposes (e.g., clarifying concepts, debugging, generating code), and how you verified or adapted their output.
If you did not use any AI tools, simply state so.
