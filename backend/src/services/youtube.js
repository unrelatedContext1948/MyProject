// services / youtube.js

let innertube = null;  //innertube is YouTube's private API, used to fetch data


//initialize innertube to access services and modules in the YouTube API
async function getInnerTube() {
    if (!innertube) {
        const { Innertube } = await import ("youtubei.js");
        innertube = await Innertube.create();
    }
    return innertube;
}

//gets yt video infos and returns them
async function getVideoInfo(url) {
    const yt = await getInnerTube();
    const videoId = new URL(url).searchParams.get("v");
    if (!videoId) throw new Error("Invalid YouTube URL");
    const info = await yt.getBasicInfo(videoId);
    const basic = info.basic_info;

    return {
        title : basic.title,
        channel : basic.author,
        duration : basic.duration,
        videoURL : url,
    };
}

module.exports = {getVideoInfo};