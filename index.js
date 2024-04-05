const express = require("express");
const fs = require('fs');

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));

function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        let mid = Math.floor((left + right) / 2);

        if (arr[mid].name === target) {
            return mid;
        } else if (arr[mid].name < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}

function mergeSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }

    const middle = Math.floor(arr.length / 2);
    const left = arr.slice(0, middle);
    const right = arr.slice(middle);

    return merge(
        mergeSort(left),
        mergeSort(right)
    );
}

function merge(left, right) {
    let result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex].name.localeCompare(right[rightIndex].name) <= 0) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }

    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

app.get('/', (req, res) => {
    const allRooms = JSON.parse(fs.readFileSync("rooms.json"));
    res.render("all-rooms", {allRooms : allRooms});
});

app.get('/admin', (req, res) => {
    res.render("admin");
});

app.get("/add-room-page", (req, res) => {
    res.render("admin");
});

app.get("/admin-page", (req, res) => {
    res.render("adminPage");
});

app.post("/admin-login", (req, res) => {
    const data = req.body.password;
    console.log(data);
    const password = "123";
    const allRooms = JSON.parse(fs.readFileSync("rooms.json"));
    if(password === data){
        let allData = [];
        allData = JSON.parse(fs.readFileSync("rooms.json"));
        let bookedRooms = []

        bookedRooms = allData.filter((d) => d.status === "occupied");

        console.log(bookedRooms);
        res.render("admin", {bookedRooms : bookedRooms});
    }
    else{
        res.render("all-rooms", {allRooms: allRooms});
    }
})

app.post('/add-room', (req, res) => {
    const data = req.body;
    const roomName = req.body.name;
    console.log(data);

    let existingData = [];

    const uniqueRooms = new Set();   // Set to store unique rooms so no duplicate room get added to rooms.json

    try {
        existingData = JSON.parse(fs.readFileSync("rooms.json"));
        existingData.forEach((room) => {
            uniqueRooms.add(room.name);
        });
    } catch (error) {
        console.error("Error reading existing data:", error);
    }

    if (!uniqueRooms.has(roomName)) {
        const roomData = {
            name: data.name,
            capacity: data.capacity,
            location: data.location,
            meetingTitle: null,
            status: "Free",
            duration: null
        };

        existingData.push(roomData);

        existingData = mergeSort(existingData)

        try {
            fs.writeFileSync("rooms.json", JSON.stringify(existingData, null, 2));
            console.log("Data added to rooms.json");
            res.send("Data added");
        } catch (error) {
            res.status(500).send("Error adding data");
        }
    } else {
        console.log("Duplicate room name");
        res.send("Invalid data");
    }
});

app.post('/delete-room', (req, res) => {
    const roomName = req.body.name;

    let existingData = [];

    try {
        existingData = JSON.parse(fs.readFileSync("rooms.json"));
    } catch (error) {
        console.error("Error reading existing data:", error);
    }

    const roomIndex = binarySearch(existingData, roomName);   //Using binary search to locate the room to delete

    if (roomIndex !== -1) {
        existingData.splice(roomIndex, 1);
        try {
            fs.writeFileSync("rooms.json", JSON.stringify(existingData, null, 2));
            console.log("Room deleted from rooms.json");
            res.send("Room deleted");
        } catch (error) {
            res.status(500).send("Error deleting room");
        }
    } else {
        console.log("Room not found");
        res.status(404).send("Room not found");
    }
});

app.get("/get-rooms", (req, res) => {
    const allRooms = JSON.parse(fs.readFileSync("rooms.json"));
    res.render("all-rooms", {allRooms : allRooms});
});

app.get("/book-room-page", (req, res) => {
    res.render("book-room");
});

app.post("/book-room", (req, res) => {
    const data = req.body;
    const userName = req.body.uname;
    const meetingTitle = req.body.mtitle;
    const roomName = data.name;
    const duration = data.duration;

    let roomsData = [];

    try {
        roomsData = JSON.parse(fs.readFileSync("rooms.json"));
    } catch (error) {
        console.error("Error reading rooms data:", error);
        res.status(500).send("Error booking room");
        return;
    }

    const roomIndex = binarySearch(roomsData, roomName);


    if (roomIndex !== -1) {
        if(roomsData[roomIndex].status !== "occupied"){
            roomsData[roomIndex].userName = userName;
            roomsData[roomIndex].duration = duration;
            roomsData[roomIndex].status = "occupied";
            roomsData[roomIndex].meetingTitle = meetingTitle;
            try {
                fs.writeFileSync("rooms.json", JSON.stringify(roomsData, null, 2));
                console.log("Room booked:", roomName);
                res.send("Room booked");
            } catch (error) {
                console.error("Error writing rooms data:", error);
                res.status(500).send("Error booking room");
            }
        }
        else{
            res.send("Room already booked.");
        }
    } else {
        console.log("Room not found:", roomName);
        res.status(404).send("Room not found");
    }
});

app.listen(8000, () => {
    console.log("Server started on port 8000");
});