// =====================================================
// PLAY WHE LINE CHART • v8.1 • December 2025
// Parse Master — grabs all 36 numbers every time
// =====================================================

const url = "https://script.google.com/macros/s/AKfycbwyr-M_ZzIscNgxJmR_UYHgZqmamn62Np4msDFaCjX9KgyUmyjuzuIYbawBmT0_mw4j/exec?action=calendar&game=P2WHE&weeks=12"
const tnyUrl = "https://www.tntyellow.com/lottery/nlcb-lotto-predictions"

const lineNumbers = {1:[1,10,19,28],2:[2,11,20,29],3:[3,12,21,30],4:[4,13,22,31],5:[5,14,23,32],6:[6,15,24,33],7:[7,16,25,34],8:[8,17,26,35],9:[9,18,27,36]}
const spirits = {1:"Centipede",2:"Old Lady",3:"Carriage",4:"Dead Man",5:"Parson Man",6:"Belly",7:"Hog",8:"Tiger",9:"Cattle",10:"Monkey",11:"Corbeau",12:"King",13:"Crapaud",14:"Money",15:"Sick Woman",16:"Jamette",17:"Pigeon",18:"Water Boat",19:"Horse",20:"Dog",21:"Mouth",22:"Rat",23:"House",24:"Queen",25:"Morrocoy",26:"Fowl",27:"Little Snake",28:"Red Fish",29:"Opium Man",30:"House Cat",31:"Parson Wife",32:"Shrimp",33:"Spider",34:"Blind Man",35:"Big Snake",36:"Donkey"}
const partners = {1:5,2:24,3:19,4:35,5:1,6:null,7:null,8:12,9:33,10:23,11:23,12:8,13:17,14:25,15:19,16:17,17:16,18:10,19:15,20:22,21:23,22:20,23:28,24:2,25:11,26:82,27:30,28:23,29:9,30:27,31:14,32:31,33:20,34:31,35:4,36:34}
const spirits_list = {1:4,2:null,3:1,4:null,5:4,6:15,7:13,8:26,9:29,10:28,11:28,12:26,13:null,14:null,15:6,16:null,17:null,18:null,19:3,20:null,21:null,22:null,23:21,24:null,25:14,26:7,27:26,28:10,29:33,30:18,31:null,32:null,33:null,34:null,35:null,36:11}  // null or "-" for none

let widget = new ListWidget()
widget.backgroundColor = new Color("#040505")
widget.setPadding(12,14,12,14)

// FETCH CALENDAR
let json = {}
try {
  let req = new Request(url)
  req.timeoutInterval = 8
  json = await req.loadJSON()
  if (json?.success) Keychain.set("PWH12", JSON.stringify(json))
} catch (_) {
  let cached = Keychain.get("PWH12")
  if (cached) json = JSON.parse(cached)
}
if (!json?.success) { widget.addText("No Data").textColor = Color.orange(); Script.setWidget(widget); Script.complete() }

const weeks = json.data.weeks
const currentWeek = weeks.find(w => w.isCurrentWeek)
const currentIndex = weeks.indexOf(currentWeek)

// SAGi FETCH — master regex
let tnyData = {}
let fetchError = false
try {
  let req = new Request(tnyUrl)
  let html = await req.loadString()

  // 1) Try to find a table that mentions "Number" or "Number Appearance" in header,
  // or fall back to the first <table> if necessary.
  let tableMatch =
    html.match(/Number Appearance Statistics[\s\S]*?<\/table>/i) ||
    html.match(/<table[^>]*>[\s\S]*?<th[^>]*>[\s\S]*?Number[\s\S]*?<\/th>[\s\S]*?<\/table>/i) ||
    html.match(/<table[^>]*>[\s\S]*?<\/table>/i)

  if (!tableMatch) throw new Error("No table found")

  let tableHtml = tableMatch[0]

  // 2) Split into rows (keep header)
  let rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []
  if (rows.length === 0) throw new Error("No rows found in table")

  // Identify header row to find the right column indices
  let headerRowHtml = rows[0]
  let headerCells = [...headerRowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => m[1].replace(/<[^>]*>/g, '').trim().toLowerCase())

  // Heuristics for column indices
  function findHeaderIndex(regex) {
    for (let i = 0; i < headerCells.length; i++) {
      if (regex.test(headerCells[i])) return i
    }
    return -1
  }
  const idxNumber = findHeaderIndex(/number|num/i)  // usually 0
  const idxDaysLeft = findHeaderIndex(/days\s*left|days left|to draw/i)
  const idxLastDraw = findHeaderIndex(/last\s*draw|last draw|last/i)

  // If header not helpful, assume typical positions: number=0, daysLeft=2, lastDraw=3 (fallback)
  const numIdx = idxNumber >= 0 ? idxNumber : 0
  const leftIdx = idxDaysLeft >= 0 ? idxDaysLeft : Math.min(2, headerCells.length - 1)
  const lastIdx = idxLastDraw >= 0 ? idxLastDraw : Math.min(3, headerCells.length - 1)

  // Skip header row and parse the rest
  for (let i = 1; i < rows.length; i++) {
    let row = rows[i]
    // extract td cell text (strip inner tags)
    let tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]*>/g, '').replace(/\u00A0/g, ' ').trim())

    if (tds.length === 0) continue
    // Number extraction (flexible)
    let nStr = (tds[numIdx] || tds[0] || "").match(/\d+/)
    if (!nStr) continue
    let n = parseInt(nStr[0])

    // Days left parsing (flexible)
    let leftCell = (tds[leftIdx] || "").toUpperCase()
    let daysLeft = 999
    if (leftCell.includes("TODAY")) daysLeft = 0
    else {
      let m = leftCell.match(/(\d+)\s*(days?|d)?/)
      if (m) daysLeft = parseInt(m[1])
    }

    // Last draw parsing (flexible)
    let lastCell = (tds[lastIdx] || "").toUpperCase()
    let daysAgo = 999
    if (lastCell.includes("TODAY")) daysAgo = 0
    else {
      let m2 = lastCell.match(/(\d+)\s*(days?\s*ago|d\s*ago)?/)
      if (m2) daysAgo = parseInt(m2[1])
    }

    tnyData[n] = {
      daysLeft,
      daysAgo,
      isToday: daysLeft === 0,
      isClose: daysLeft > 0 && daysLeft <= 3
    }
  }

  // If we parsed fewer than a reasonable count, log for debugging but don't necessarily fail
  const parsedCount = Object.keys(tnyData).length
  console.log("SAGi parsed count:", parsedCount)
  if (parsedCount < 20) {
    // Log a short snippet so you can inspect the real table HTML in console
    console.log("SAGi parse suspicious — rows:", rows.length, "headerCells:", headerCells)
    
    fetchError = true
  }
} catch (e) {
  fetchError = true
  console.log("SAGi Error: " + e)
}

// WEEK TRACKING
let currentPlayed = new Set(), weekRepeats = {}
currentWeek.days.forEach(d => ['MOR','MID','NON','EVE'].forEach(t => {
  let n = d.draws[t]
  if (n && n!=="PENDING" && n!=="-") {
    let num = parseInt(n)
    currentPlayed.add(num)
    weekRepeats[num] = (weekRepeats[num] || 0) + 1
  }
}))

// LAST / NEXT / TO MEET
let lastNum=null, lastTime=null, lastDay=null, nextTime=null, nextDay=null
const order = ['MOR','MID','NON','EVE']
for (let day of currentWeek.days) {
  for (let t of order) {
    let n = day.draws[t]
    if (n && n!=="PENDING" && n!=="-") { lastNum=parseInt(n); lastTime=t; lastDay=day.dayName }
    else if (n==="PENDING" && !nextTime) { nextTime=t; nextDay=day.dayName; break }
  }
  if (nextTime) break
}
let meetNum = null, weeksBack = 1
while (weeksBack <= 11 && !meetNum) {
  let w = weeks[currentIndex - weeksBack]
  if (w) { let d = w.days.find(x => x.dayName === nextDay)
    if (d) { let c = d.draws[nextTime]; if (c && c!=="-" && c!=="PENDING") meetNum = parseInt(c) }}
  weeksBack++
}

function getLine(n) { for (let l=1;l<=9;l++) if (lineNumbers[l].includes(n)) return `${l}L`; return "" }

// SMART COLDEST
function getSmartColdest(num) {
  if (fetchError) return { text: "SAGi ERROR", color: Color.orange() }
  let d = tnyData[num] || {daysLeft:999, daysAgo:999, isToday:false, isClose:false}
  let numStr = String(num).padStart(2,"0")
  let agoStr = d.daysAgo < 999 ? `${d.daysAgo}d ago` : "??d ago"

  if (d.isToday)  return { text: `${numStr} DT • ${agoStr}`, color: Color.red() }
  if (d.isClose)  return { text: `${numStr} SOON • ${agoStr}`, color: new Color("#ff6b6b") }
  let left = d.daysLeft < 999 ? `${d.daysLeft}d left • ` : ""
  let col = d.daysLeft <= 5 ? new Color("#ffd43b") : new Color("#69db7c")
  return { text: `${numStr} ${left}${agoStr}`, color: col }
}

// TITLE
let title = widget.addText("PLAY WHE LINE CHART")
title.font = Font.boldSystemFont(14); title.textColor = new Color("#ffd43b"); title.centerAlignText()
widget.addSpacer(4)

// LEAVING / TO MEET
let banner = widget.addStack()
banner.layoutHorizontally()
banner.centerAlignContent()

// Determine if we're in "week done" state
let weekIsDone = (!nextTime && !nextDay) || (nextDay === "Saturday" && nextTime === "EVE")

if (weekIsDone) {
  let completedText = banner.addText("Play Whe Draw Tracking Resumes Monday")
  completedText.font = Font.boldSystemFont(14)
  completedText.textColor = new Color("#ffd43b")
  completedText.centerAlignText()
} else {
  // Helper to get P/S string
  function getPS(num) {
    if (!num) return ""
    let p = partners[num]
    let s = spirits_list[num]
    let parts = []
    if (p) parts.push(`P${p}`)
    if (s) parts.push(`S${s}`)
    return parts.length > 0 ? parts.join(" / ") : ""
  }

  // --- LEAVING ---
  let leavingText = "No draws yet"

  if (lastNum) {
    let ps = getPS(lastNum)
    let psPart = ps ? ` • ${ps}` : ""
    leavingText = `Leaving (${(lastDay?.slice(0,3) ?? "?")} ${lastTime})\n${lastNum} ${spirits[lastNum] || "?"} • ${getLine(lastNum)}${psPart}`
  } 
  else if (!lastNum && currentIndex > 0) {
    let prevWeek = weeks[currentIndex - 1]
    if (prevWeek) {
      let sat = prevWeek.days.find(d => d.dayName === "Saturday")
      if (sat && sat.draws.EVE && sat.draws.EVE !== "-" && sat.draws.EVE !== "PENDING") {
        let prevEve = parseInt(sat.draws.EVE)
        let ps = getPS(prevEve)
        let psPart = ps ? ` • ${ps}` : ""
        leavingText = `Leaving (Sat EVE)\n${prevEve} ${spirits[prevEve]} • ${getLine(prevEve)}${psPart}`
      }
    }
  }

  let l = banner.addText(leavingText)
  l.font = Font.boldSystemFont(10)
  l.textColor = Color.red()
  l.lineLimit = 2

  banner.addSpacer()

  // --- TO MEET ---
  let meetHeader = "To Meet (Mon MOR)"
  let meetBody = "??"

  if (nextDay && nextTime) {
    meetHeader = `To Meet (${nextDay.slice(0,3)} ${nextTime})`
  }

  if (meetNum) {
    let ps = getPS(meetNum)
    let psPart = ps ? ` • ${ps}` : ""
    meetBody = `${meetNum} ${spirits[meetNum]} • ${getLine(meetNum)}${psPart}`
  } 
  else if (!lastNum && currentIndex > 0) {
    let weeksBack = 1
    let found = false
    while (weeksBack <= 11 && !found) {
      let w = weeks[currentIndex - weeksBack]
      if (w) {
        let mon = w.days.find(d => d.dayName === "Monday")
        if (mon && mon.draws.MOR && mon.draws.MOR !== "-" && mon.draws.MOR !== "PENDING") {
          meetNum = parseInt(mon.draws.MOR)
          let ps = getPS(meetNum)
          let psPart = ps ? ` • ${ps}` : ""
          meetBody = `${meetNum} ${spirits[meetNum]} • ${getLine(meetNum)}${psPart}`
          found = true
        }
      }
      weeksBack++
    }
  }

  let meetText = `${meetHeader}\n${meetBody}`
  let r = banner.addText(meetText)
  r.font = Font.boldSystemFont(10)
  r.textColor = new Color("#ffd43b")
  r.lineLimit = 2
}

widget.addSpacer(8)

// HOT REPEATS
let hotList = Object.entries(weekRepeats).filter(([_,c])=>c>1).sort((a,b)=>b[1]-a[1])
if (hotList.length>0) {
  let box = widget.addStack(); box.backgroundColor = Color.white(); box.cornerRadius = 6; box.setPadding(4,6,4,6)
  let txt = hotList.map(([n,c])=>`${n} ${spirits[n]} (${c}×)`).join(" • ")
  let h = box.addText(`🔥 H.R.T.WK: ${txt}`); h.font = Font.boldSystemFont(9.5); h.textColor = Color.black()
  widget.addSpacer(6)
}

// HEADER
let header = widget.addStack(); header.layoutHorizontally(); header.centerAlignContent()
function head(t,w){let s=header.addStack();s.size=new Size(w,22);let x=s.addText(t);x.font=Font.mediumSystemFont(9);x.textColor=new Color("#58a6ff");x.centerAlignText()}
head("Line",34); head("Marks",84); head("Played",70); head("Coldest",96); head("Trend",48)
widget.addSpacer(4)

// LINES
for (let ln=1; ln<=9; ln++) {
  let nums = lineNumbers[ln]
  let playedThisWeek = nums.filter(n => currentPlayed.has(n)).sort((a,b)=>a-b)
  let txt = playedThisWeek.map(n=>String(n).padStart(2,"0")).join(" ")
  let unplayed = nums.filter(n => !currentPlayed.has(n))

  let row = widget.addStack(); row.layoutHorizontally()
  if (playedThisWeek.length===0) row.backgroundColor = new Color("#ff000040")
  else if (playedThisWeek.length<=1) row.backgroundColor = new Color("#ff6b6b30")

  // Line
  let c1 = row.addStack(); c1.size = new Size(34,24)
  let lt = c1.addText(String(ln)); lt.font=Font.boldSystemFont(13); lt.textColor=Color.white(); c1.centerAlignContent()

  // Marks
  let marks = nums.map(n=>String(n).padStart(2,"0")).join(" ")
  let c2 = row.addStack(); c2.size = new Size(84,24)
  let mt = c2.addText(marks); mt.font=Font.mediumSystemFont(8.8); mt.textColor=new Color("#8b949e"); c2.centerAlignContent()

  // Played
  let c3 = row.addStack(); c3.size = new Size(70,24)
  if (playedThisWeek.length>0) { let pt=c3.addText(txt); pt.font=Font.mediumSystemFont(10); pt.textColor=new Color("#69db7c") }
  else c3.addText("—").textColor=new Color("#8b949e")
  c3.centerAlignContent()

  // COLDEST
  let c4 = row.addStack(); c4.size = new Size(96,24)
  if (unplayed.length>0) {
    let candidates = unplayed.map(n => ({num:n, info:getSmartColdest(n)}))
    let coldest = candidates.sort((a,b) => {
      if (a.info.text.includes("DT")) return -1
      if (b.info.text.includes("DT")) return 1
      if (a.info.text.includes("SOON")) return -1
      if (b.info.text.includes("SOON")) return 1
      return 0
    })[0]
    let ct = c4.addText(coldest.info.text)
    ct.font = Font.mediumSystemFont(coldest.info.text.includes("DT") ? 9.6 : 9.3)
    ct.textColor = coldest.info.color
  } else c4.addText("All Played").textColor=new Color("#69db7c")
  c4.centerAlignContent()

  // Trend
  let c5 = row.addStack(); c5.size = new Size(48,24)
  let hits = playedThisWeek.length
  if (hits>0) {
    let ht = c5.addText(hits>1?`${hits}×`:`${hits}×`)
    ht.font = Font.boldSystemFont(11)
    ht.textColor = hits>=3?Color.red():hits==2?new Color("#ff6b6b"):new Color("#69db7c")
  } else c5.addText("—").textColor=new Color("#666")
  c5.centerAlignContent()

  widget.addSpacer(2)
}

// FOOTER
widget.addSpacer(6)
let foot = widget.addText(`Play Whe Line Chart • ${new Date().toLocaleTimeString("en-TT",{weekday: "long", hour:"numeric",minute:"2-digit"})} • FSP SAGi • v8.1`)
foot.font = Font.mediumSystemFont(8); foot.textColor = new Color("#8b949e"); foot.centerAlignText()

// -----------------------------------------
// AUTO-REFRESH (Silent, iOS-approved)
// ----------------------------------------
widget.refreshAfterDate = new Date(Date.now() + 4 * 60 * 1000) // every 4 minutes

Script.setWidget(widget)
Script.complete()