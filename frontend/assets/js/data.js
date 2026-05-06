// This only dummy data as (beofre the prototype)
// can be seen as 'fake DB'
// arrays should be replaced later with idk fetch api?

const QUEUE = [
  {
    title: "The Kid LAROI, Justin Bieber - STAY (Official Video)",
    submittedBy: "user_1",
    duration: "3:48",
    isAdbreak: false,
  },
  {
    title: "Bruno Mars - Risk it all (Official Video)",
    submittedBy: "user_2",
    duration: "3:02",
    isAdbreak: false,
  },
  {
    title: "Olivia Rodrigo - drop dead (Official Video)",
    submittedBy: "user_3",
    duration: "4:11",
    isAdbreak: false,
  },
  {
    title: "AD Break",
    submittedBy: "admin_1",
    duration: "0:45",
    isAdbreak: true,
    adText:
      " New publication about topic A has been published , and can be seen in the website",
  },
  {
    title: "Mozart - Piano Sonata No.11",
    submittedBy: "user_1",
    duration: "6:03",
    isAdbreak: false,
  },
  {
    title: " Yung Kai - blue (Official Video)",
    submittedBy: "admin_1",
    duration: "2:36",
    isAdbreak: false,
  },
  {
    title: "Billie Eilish - Bad Guy (Official Video)",
    submittedBy: "user_4",
    duration: "4:12",
    isAdbreak: false,
  },
];

//which track is playing rn, backend will  replace this with websocket?
let currentIndex = 0;

// demo log in for prototype only, will be deleted later
const DEMO_LOGIN = {
  user: { password: "user123", role: "user" },
  admin: { password: "admin123", role: "admin" },
};
