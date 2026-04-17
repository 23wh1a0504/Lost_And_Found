const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const filePath = path.join(dataDir, "lostFoundItems.json");

const sampleItems = [
  {
    id: 1,
    item_name: "Record Book",
    category: "Books",
    description: "Record book with Vishnu logo on it.",
    location: "Hostel Study Room",
    type: "found",
    status: "pending"
  },
  {
    id: 2,
    item_name: "Water Bottle",
    category: "Accessories",
    description: "Black water bottle found near hostel study room.",
    location: "Hostel Corridor",
    type: "found",
    status: "approved"
  },
  {
    id: 3,
    item_name: "Key Chain",
    category: "Keys",
    description: "Silver key chain reported lost near hostel entrance.",
    location: "Hostel Entrance",
    type: "lost",
    status: "pending"
  }
];

const runFileOperationsDemo = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(sampleItems, null, 2), "utf-8");
    console.log("Sample lost and found data written successfully.");

    const storedData = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(storedData);

    console.log("Data read from file:");
    console.log(parsedData);
  } catch (error) {
    console.error("File operation failed.");
    console.error(error.message);
    process.exitCode = 1;
  }
};

runFileOperationsDemo();
