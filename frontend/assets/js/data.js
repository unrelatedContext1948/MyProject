/*
This only dummy data i made, for visualization for the UI
can be seen as 'fake DB'
arrays should be replaced later with idk fetch api?

This is the list of songs and ad breaks a.k.a The Queue list
   Each item is an object with these fields:
     - title: the name shown in the queue
     - submittedBy: who added this song
     - duration: how long it is
     - type: video or ad break
     - adText: the text of the ad (only for ad breaks) 

*/
const QUEUE = [
  {
    title: "The Kid LAROI, Justin Bieber - STAY (Official Video)",
    submittedBy: "user_1",
    duration: "3:48",
    type: "video",
  },
  {
    title: "Bruno Mars - Risk it all (Official Video)",
    submittedBy: "user_2",
    duration: "3:02",
    type: "video",
  },
  {
    title: "Olivia Rodrigo - drop dead (Official Video)",
    submittedBy: "user_3",
    duration: "4:11",
    type: "video",
  },
  {
    title: "AD Break",
    submittedBy: "admin_1",
    duration: "0:45",
    type: "adbreak",
    adText:
      " New publication about topic A has been published , and can be seen in the website and also the full documentation for the paper is now ",
  },
  {
    title: "Mozart - Piano Sonata No.11",
    submittedBy: "user_1",
    duration: "6:03",
    type: "video",
  },
  {
    title: " Yung Kai - blue (Official Video)",
    submittedBy: "admin_1",
    duration: "2:36",
    type: "video",
  },
  {
    title: "Billie Eilish - Bad Guy (Official Video)",
    submittedBy: "user_4",
    duration: "4:12",
    type: "video",
  },
];

//which track is playing rn, backend will  replace this with websocket?
let currentIndex = 0;

/* demo log in for prototype only, can be deleted later
later will be replaced with API login username, password n the server return with role (admin or  auth. user)
The role is determined automatically by the username and password combination.
*/

const DEMO_LOGIN = [
  { username: "user", password: "user123", role: "user" },
  { username: "admin", password: "admin123", role: "admin" },
];
