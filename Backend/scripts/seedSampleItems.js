require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Item = require("../models/Item");

const sampleUserEmail = "samples@hostel.com";

const sampleItems = [
  {
    item_name: "Blue Backpack",
    category: "Accessories",
    description: "Navy blue backpack with a front zipper pocket and a small hostel keychain attached.",
    location: "Hostel Reception",
    date: new Date("2026-04-02"),
    type: "found",
    status: "approved",
    image: "sample-backpack.jpg"
  },
  {
    item_name: "Stack Of White Books",
    category: "Books",
    description: "A tall stack of plain white books placed on a desk, with no visible labels on the covers.",
    location: "Study Room",
    date: new Date("2026-04-03"),
    type: "found",
    status: "pending",
    image: "sample-books.jpg"
  },
  {
    item_name: "White Study Books",
    category: "Books",
    description: "Several white study books stacked neatly together, photographed from the side on a table.",
    location: "Hostel Library",
    date: new Date("2026-04-05"),
    type: "found",
    status: "approved",
    image: "sample-books.jpg"
  },
  {
    item_name: "Metal Keychain",
    category: "Keys",
    description: "A silver key attached to a metal keychain with a cartoon couple riding a bicycle charm.",
    location: "Block B Staircase",
    date: new Date("2026-04-01"),
    type: "lost",
    status: "rejected",
    image: "sample-keys.jpg"
  },
  {
    item_name: "Steel Water Bottle",
    category: "Accessories",
    description: "Matte steel water bottle with a black cap, found after evening study hours.",
    location: "Common Room",
    date: new Date("2026-04-04"),
    type: "found",
    status: "returned",
    image: "sample-water-bottle.jpg"
  }
];

const seedSampleItems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let sampleUser = await User.findOne({ email: sampleUserEmail });

    if (!sampleUser) {
      const hashedPassword = await bcrypt.hash("Sample123!", 10);
      sampleUser = await User.create({
        name: "Sample Student",
        email: sampleUserEmail,
        password: hashedPassword,
        role: "user"
      });
      console.log(`Created sample user: ${sampleUserEmail}`);
    }

    for (const item of sampleItems) {
      const existingItem = await Item.findOne({
        item_name: item.item_name,
        image: item.image
      });

      if (existingItem) {
        existingItem.set({
          ...item,
          user_id: sampleUser._id
        });
        await existingItem.save();
        console.log(`Updated sample item: ${item.item_name}`);
      } else {
        await Item.create({
          ...item,
          user_id: sampleUser._id
        });
        console.log(`Inserted sample item: ${item.item_name}`);
      }
    }
  } catch (error) {
    console.error("Unable to seed sample items.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedSampleItems();
