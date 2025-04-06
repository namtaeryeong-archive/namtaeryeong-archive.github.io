
    document.addEventListener("DOMContentLoaded", async function () {
      const tweetListDiv = document.getElementById("tweet-list");
      const tweetListContainer = document.getElementById("tweet-list-container");
      //const timeSlider = document.getElementById("time-slider");
      const timeTicks = document.getElementById("time-ticks");
      const timeDisplay = document.getElementById("current-time-display");

      let tweetsData = [];

      function parseKST(dateString) {
        const timestamp = Date.parse(dateString);
        return isNaN(timestamp) ? null : timestamp;
      }

      function formatTimestampForDisplay(timestamp) {
        const date = new Date(timestamp + 9 * 60 * 60 * 1000);
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${month}월 ${day}일  ${hours}시 ${minutes}분`;
      }

      function generateTimeTicks(minTimestamp, maxTimestamp) {
        // check if there's any ticks, flush first
        // is this necessary?
        const tickContainer = document.getElementById("time-ticks");
        //const histogramContainer = document.getElementById("histogram-bars");
        tickContainer.querySelectorAll(".tick").forEach(el => el.remove());

        const hourMs = 3600000;
        let start = new Date(minTimestamp);
        start.setUTCMinutes(0, 0, 0);
        let startMs = start.getTime();
        if (startMs < minTimestamp) {
          startMs += hourMs;
        }

        for (let t = startMs; t <= maxTimestamp; t += hourMs) {
          const tick = document.createElement("div");
          tick.classList.add("tick");
          tick.dataset.timestamp = t;
          if (t === startMs){
            tick.classList.add("tick-active");
          }

          tick.addEventListener("click", () => {
            scrollToTweet(t);
          });

          const kstDate = new Date(t + 9 * 60 * 60 * 1000);
          if (kstDate.getUTCHours() === 0) {
            tick.classList.add("tick-day");
          }


          // ticks does not show if i erase two lines here - why?
          const leftPercent = ((t - minTimestamp) / (maxTimestamp - minTimestamp)) * 100;
          tick.style.left = `${leftPercent}%`;

          const hh = String(kstDate.getUTCHours()).padStart(2, '0');
          const dd = String(kstDate.getUTCDate()).padStart(2, '0');
          const mm = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
          tick.title = `${mm}.${dd} ${hh}:00 KST`;

          tickContainer.appendChild(tick);
          console.log("hahahah");

        }
      }

/*
      function generateHistogramBars(tweets, minTimestamp, maxTimestamp) {
        const container = document.getElementById("histogram-bars");
        container.innerHTML = "";

        const hourMs = 3600000;
        const counts = {};

        tweets.forEach(tweet => {
          const kst = new Date(tweet.timestamp + 9 * hourMs);
          kst.setUTCMinutes(0, 0, 0);
          const hourKey = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), kst.getUTCHours())).getTime() - 9 * hourMs;
          counts[hourKey] = (counts[hourKey] || 0) + 1;
        });

        const hours = [];
        for (let t = minTimestamp; t <= maxTimestamp; t += hourMs) hours.push(t);
        const maxCount = Math.max(...hours.map(t => counts[t] || 0), 1);

        hours.forEach(t => {
          const count = counts[t] || 0;
          const left = ((t - minTimestamp) / (maxTimestamp - minTimestamp)) * 100;
          const bar = document.createElement("div");
          bar.className = "histobar";
          bar.style.left = `${left}%`;
          bar.style.height = `${(count / maxCount) * 100}%`;
          bar.title = `${count} tweet${count !== 1 ? "s" : ""}`;
          container.appendChild(bar);
        });
      }
      */

      async function loadTweetLinks() {
        const res = await fetch("file.json");
        const rawData = await res.json();

        rawData.forEach(tweet => {
          const timestamp = parseKST(tweet.created_at_KST);
          if (timestamp !== null) {
            tweetsData.push({ ...tweet, timestamp });
          }
        });

        tweetsData.sort((a, b) => a.timestamp - b.timestamp);

        // rawData to tweetsdata sort, can be replaced because it's already sorted the input file.


        // add div tweet-container for each tweet data,
        // for each div, add a dataset value - i didn't know this before! good to know.
        // write html code and append it to the tweetlistdiv
        // must it be a timestamp, really?

        tweetsData.forEach(tweet => {

          let timestamp = tweet.created_at_KST.slice(0,-6);
          let retweet_marker = timestamp;
          let profilepic = "tweet-profile";
          if (tweet.is_retweeted_by.length !== 0){
            retweet_marker = "리트윗 by " + tweet.is_retweeted_by + " at " +timestamp;
            profilepic = "tweet-profile-retweet";

          };

          const div = document.createElement("div");
          div.classList.add("tweet-container");
          div.dataset.timestamp = tweet.timestamp;
          div.innerHTML = `
            <div class="${profilepic}"></div>

            <div class="tweet-content">
            <p style="font-size: .7em">${retweet_marker}</p>
            <p><strong>@${tweet.masked_id}</strong></br></p>
              <p>${tweet.masked_text}</p>
              <p><a href="${tweet.full_url}" target="_blank" rel="noopener noreferrer">🔗</a></p>
            </div>


          `;
          if (tweet.media_media_url_https !== "False") {
                try {
                    let medialist = tweet.media_media_url_https.slice(2, -2).split("', '");
                    medialist.forEach((mediaUrl) => {
                        let img = document.createElement("img");
                        img.src = mediaUrl;
                        const contentDiv = div.querySelector(".tweet-content");
                        contentDiv.appendChild(img);
                    });
                } catch (e) {
                    console.warn("Invalid media format:", tweet.media_media_url_https);
                }
            }
          tweetListDiv.appendChild(div);
        });



        // the following line is indep from the above
        const minTimestamp = tweetsData[0].timestamp;
        const maxTimestamp = tweetsData[tweetsData.length - 1].timestamp;

        const minTimestampFloor = Math.floor(minTimestamp/3600000)*3600000;
        const maxTimestampCeil = Math.ceil(maxTimestamp/3600000)*3600000; // round up
/*
        timeSlider.min = Math.floor(minTimestamp/3600000)*3600000 // ; // round down
        timeSlider.max = Math.ceil(maxTimestamp/3600000)*3600000; // round up
        timeSlider.value = minTimestamp;
        timeSlider.step = 1;
        timeSlider.disabled = false;
 */
        // set to the starting tweet timestamp
        timeDisplay.textContent = formatTimestampForDisplay(minTimestamp);

        generateTimeTicks(minTimestampFloor, maxTimestampCeil);
        //generateHistogramBars(tweetsData, minTimestamp, maxTimestamp);










      }



      function scrollToTweet(ts) {
        const tweets = document.querySelectorAll(".tweet-container");
        for (let el of tweets) {
          const t = parseInt(el.dataset.timestamp, 10);
          if (t >= ts) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            break;
          }
        }
      }
      // okay i got this now


      tweetListContainer.addEventListener("scroll", () => {
        const tweets = document.querySelectorAll(".tweet-container");
        const containerTop = tweetListContainer.getBoundingClientRect().top;
        let closest = null;
        let minDiff = Infinity;

        tweets.forEach(tweet => {
          const top = tweet.getBoundingClientRect().top;
          const diff = Math.abs(top - containerTop);
          if (diff < minDiff) {
            minDiff = diff;
            closest = tweet;
          }
        });

        if (closest) {
          const ts = parseInt(closest.dataset.timestamp, 10);
          //timeSlider.value = ts;
          timeDisplay.textContent = formatTimestampForDisplay(ts);

          const ticks = document.querySelectorAll("#time-ticks .tick");
          ticks.forEach(tick => {
            const tickTs = parseInt(tick.dataset.timestamp, 10);
            const sameHour = new Date(tickTs).getHours() === new Date(ts).getHours();
            const sameDay = new Date(tickTs).toDateString() === new Date(ts).toDateString();
            if (sameHour && sameDay) {
              tick.classList.add("tick-active");
            } else {
              tick.classList.remove("tick-active");
            }
          });
        }
      });

      loadTweetLinks();
    });
