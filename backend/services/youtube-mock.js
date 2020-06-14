// const CACHE = {
// }

// //CLEAR EVERY HOUR
// setInterval(() => {
//     CACHE = {}
// }, 60*60000);

const search = (q, pageToken) => {
    return Promise.resolve({
        items: [
          {
            videoId: 'JHhO5JKofgc',
            title: 'Big Ed Tries to EXPOSE Rose LIVE!',
            description: 'Big Ed on TLC brings out evidence while fighting with Rose live Floor Gang Merch! https://represent.com/store/pewdiepie (Thank you) Subscribe to become a ...',
            channelTitle: 'PewDiePie',
            videoThumbnail: 'https://i.ytimg.com/vi/JHhO5JKofgc/mqdefault.jpg',
            channelThumbnail: 'https://yt3.ggpht.com/a/AATXAJzlZzr16izsGHBCHIkO3H7n-UiHyZPCJFEPiQ=s88-c-k-c0xffffffff-no-rj-mo'
          },
          {
            videoId: 'g6-sx7sIL6I',
            title: 'I Havn&#39;t Been Honest..',
            description: 'This is so sad. No more Floor Gang Floor Gang Merch! https://represent.com/store/pewdiepie (Thank you) Subscribe to become a FLOOR GANG Member here: ...',
            channelTitle: 'PewDiePie',
            videoThumbnail: 'https://i.ytimg.com/vi/g6-sx7sIL6I/mqdefault.jpg',
            channelThumbnail: 'https://yt3.ggpht.com/a/AATXAJzlZzr16izsGHBCHIkO3H7n-UiHyZPCJFEPiQ=s88-c-k-c0xffffffff-no-rj-mo'
          },
          {
            videoId: 'Ill-HXjQWUs',
            title: 'CocoMelon - The New Biggest Channel on ALL YOUTUBE!',
            description: 'Cocomelon is taking over youtube as the biggest most subscribed channel Floor Gang Merch! https://represent.com/store/pewdiepie (Thank you) Subscribe to ...',
            channelTitle: 'PewDiePie',
            videoThumbnail: 'https://i.ytimg.com/vi/Ill-HXjQWUs/mqdefault.jpg',
            channelThumbnail: 'https://yt3.ggpht.com/a/AATXAJzlZzr16izsGHBCHIkO3H7n-UiHyZPCJFEPiQ=s88-c-k-c0xffffffff-no-rj-mo'
          },
          {
            videoId: 'ph8M_8sVOEA',
            title: 'PewDiePie&#39;s biggest OOPSIE.  � PEW NEWS�',
            description: 'N E W  M E R C H  : https://represent.com/pewdiepie (◡‿◡✿) Submit M E M E S: https://www.reddit.com/r/PewdiepieSubmissions/ ༼♥ل͜♥༽ __ AD| Shop my ...',
            channelTitle: 'PewDiePie',
            videoThumbnail: 'https://i.ytimg.com/vi/ph8M_8sVOEA/mqdefault.jpg',
            channelThumbnail: 'https://yt3.ggpht.com/a/AATXAJzlZzr16izsGHBCHIkO3H7n-UiHyZPCJFEPiQ=s88-c-k-c0xffffffff-no-rj-mo'
          }
        ],
        nextPageToken: 'CAUQAA',
        totalResults: 182248
      });
}

const _getChannels = (channelIds) => {
    return Promise.resolve({
        'UC-lHJZR3Gqxm24_Vd_AJ5Yw': {
          channelId: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',
          channelThumbnail: 'https://yt3.ggpht.com/a/AATXAJzlZzr16izsGHBCHIkO3H7n-UiHyZPCJFEPiQ=s88-c-k-c0xffffffff-no-rj-mo'
        },
        'UCzmtKpQQyZ-9ZNY_bbFtVHw': {
          channelId: 'UCzmtKpQQyZ-9ZNY_bbFtVHw',
          channelThumbnail: 'https://yt3.ggpht.com/a/AATXAJxQX_sIprqr9vXTng3SAaC26d0pcCKa3azO7w=s88-c-k-c0xffffffff-no-rj-mo'
        }
      });
}

module.exports = {
    search
}