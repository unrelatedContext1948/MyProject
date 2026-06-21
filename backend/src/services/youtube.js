// services / youtube.js

let innertube = null; //innertube is YouTube's private API, used to fetch data

//initialize innertube to access services and modules in the YouTube API
async function getInnerTube() {
  if (!innertube) {
    const { Innertube } = await import("youtubei.js");
    innertube = await Innertube.create();
  }
  return innertube;
}

function getDuration(seconds) {
  // isNaN is a JavaScript function that checks if the value is not a number
  // If it is not a number, it returns "--:--"
  if (!seconds || isNaN(seconds)) return "--:--";

  const totalSeconds = Math.floor(Number(seconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  /*
Format the duration as HH:MM:SS or MM:SS depending on whether hours are present
toString().padStart(2, "0") is used to ensure that minutes and seconds are always displayed as two digits (e.g., "05" instead of "5")
If hours are greater than 0, include hours in the format, otherwise just show minutes and seconds
Example: 3661 seconds would be formatted as "1:01:01", while 61 seconds would be formatted as "01:01"
The so called "Template Literals ${expression}" is evaluated as pure JavaScript code and inserted directly into 
the text string. This completely eliminates the need for messy string concatenation 
with the plus (+) operator!
NOTICE: Template Literals must be used with backticks (` `) instead of single or double quotes, otherwise it will not work and be treated as a normal string.
*/

  return `${hours > 0 ? hours + ":" : ""}${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1); // For short URLs like youtu.be/abc123
    }
    return urlObj.searchParams.get("v"); // For standard URLs like youtube.com/watch?v=abc123
  } catch (e) {
    console.error("Invalid URL:", url);
    return null;
  }
}

//gets yt video infos and returns them
async function getVideoInfo(url) {
  const yt = await getInnerTube();
  const videoId = extractVideoId(url);
  const info = await yt.getBasicInfo(videoId);
  const basic = info.basic_info;

  return {
    title: basic.title,
    channel: basic.author.name || basic.author,
    duration: getDuration(basic.duration),
    videoURL: url,
  };
}

module.exports = { getVideoInfo };
