const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
require("../models/User");
const Item = require("../models/Item");
const editableFields = ["item_name", "category", "description", "location", "date", "type"];
const allowedStatuses = ["approved", "rejected", "returned", "pending"];

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const isValidItemId = (value) => mongoose.isValidObjectId(value);

const removeImage = async (filename) => {
  if(!filename) {
    return;
  }

  const safeFilename = path.basename(filename);

  try {
    await fs.unlink(path.join(uploadsDir, safeFilename));
  } catch (error) {
    if(error.code !== "ENOENT") {
      throw error;
    }
  }
};

const canManageItem = (item, user) => {
  if(!item || !user) {
    return false;
  }

  return user.role === "admin" || String(item.user_id) === String(user.id);
};

const buildItemPayload = (body) => {
  const payload = {};

  editableFields.forEach((field) => {
    if(body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  return payload;
};

const buildFilters = (query, user) => {
  const filters = {};
  const isAdmin = user?.role === "admin";
  const showMine = query.mine === "true" && user?.id;

  if(query.type && query.type !== "all") {
    filters.type = query.type;
  }

  if(showMine) {
    filters.user_id = user.id;
  }

  if(query.status && query.status !== "all") {
    if(isAdmin || showMine || ["approved","returned"].includes(query.status)) {
      filters.status = query.status;
    } else {
      filters.status = "approved";
    }
  } else if(!isAdmin && !showMine) {
    filters.status = "approved";
  }

  if(query.search) {
    filters.$or = [
      { item_name: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
      { location: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } }
    ];
  }

  return filters;
};

exports.createItem = async (req,res)=>{
  try {
    const { item_name, category, description, location, date, type } = req.body;

    if(!item_name || !category || !description || !location || !date || !type) {
      return res.status(400).json({message:"Please fill in all required item details"});
    }

    const item = await Item.create({
      item_name,
      category,
      description,
      location,
      date,
      type,
      user_id: req.user.id,
      image: req.file?.filename
    });

    const populatedItem = await item.populate("user_id","name email role");

    return res.status(201).json(populatedItem);
  } catch (error) {
    console.error("createItem error:", error);
    return res.status(500).json({message:"Unable to create item"});
  }
};

exports.getItems = async (req,res)=>{
  try {
    const filters = buildFilters(req.query, req.user);

    const items = await Item.find(filters)
      .populate("user_id","name email role")
      .sort({ createdAt: -1 });

    return res.json(items);
  } catch (error) {
    console.error("getItems error:", error);
    return res.status(500).json({message:"Unable to fetch items"});
  }
};

exports.getItemsCount = async (req,res)=>{
  try {
    const filters = buildFilters(req.query, req.user);
    const count = await Item.countDocuments(filters);

    return res.json({ count });
  } catch (error) {
    console.error("getItemsCount error:", error);
    return res.status(500).json({message:"Unable to fetch item count"});
  }
};

exports.getItemById = async (req,res)=>{
  try {
    if(!isValidItemId(req.params.id)) {
      return res.status(400).json({message:"Invalid item id"});
    }

    const item = await Item.findById(req.params.id).populate("user_id","name email role");

    if(!item) {
      return res.status(404).json({message:"Item not found"});
    }

    const isOwner = req.user?.id && String(item.user_id?._id || item.user_id) === String(req.user.id);
    const isAdmin = req.user?.role === "admin";
    const isVisibleToPublic = ["approved","returned"].includes(item.status);

    if(!isVisibleToPublic && !isOwner && !isAdmin) {
      return res.status(403).json({message:"You do not have access to this item"});
    }

    return res.json(item);
  } catch (error) {
    console.error("getItemById error:", error);
    return res.status(500).json({message:"Unable to fetch item"});
  }
};

exports.updateItem = async (req,res)=>{
  try {
    if(!isValidItemId(req.params.id)) {
      if(req.file?.filename) {
        await removeImage(req.file.filename);
      }

      return res.status(400).json({message:"Invalid item id"});
    }

    const item = await Item.findById(req.params.id);

    if(!item) {
      if(req.file?.filename) {
        await removeImage(req.file.filename);
      }

      return res.status(404).json({message:"Item not found"});
    }

    if(!canManageItem(item, req.user)) {
      if(req.file?.filename) {
        await removeImage(req.file.filename);
      }

      return res.status(403).json({message:"You do not have permission to update this item"});
    }

    const updates = buildItemPayload(req.body || {});

    if(req.file?.filename) {
      updates.image = req.file.filename;
    }

    const hasMissingRequiredField = editableFields.some((field) =>
      updates[field] !== undefined && !String(updates[field]).trim()
    );

    if(hasMissingRequiredField) {
      if(req.file?.filename) {
        await removeImage(req.file.filename);
      }

      return res.status(400).json({message:"Required item fields cannot be empty"});
    }

    if(updates.type && !["lost","found"].includes(updates.type)) {
      if(req.file?.filename) {
        await removeImage(req.file.filename);
      }

      return res.status(400).json({message:"Unsupported item type"});
    }

    if(req.user.role !== "admin" && Object.keys(updates).length) {
      updates.status = "pending";
    }

    const previousImage = item.image;

    Object.assign(item, updates);
    await item.save();

    if(req.file?.filename && previousImage && previousImage !== req.file.filename) {
      await removeImage(previousImage);
    }

    const updatedItem = await Item.findById(item._id).populate("user_id","name email role");
    return res.json(updatedItem);
  } catch (error) {
    console.error("updateItem error:", error);
    if(req.file?.filename) {
      await removeImage(req.file.filename).catch(() => null);
    }

    return res.status(500).json({message:"Unable to update item"});
  }
};

exports.updateItemStatus = async (req,res)=>{
  try {
    if(!isValidItemId(req.params.id)) {
      return res.status(400).json({message:"Invalid item id"});
    }

    const { status } = req.body;

    if(!allowedStatuses.includes(status)) {
      return res.status(400).json({message:"Unsupported status"});
    }

    const item = await Item.findById(req.params.id);

    if(!item) {
      return res.status(404).json({message:"Item not found"});
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).populate("user_id","name email role");

    return res.json(updatedItem);
  } catch (error) {
    console.error("updateItemStatus error:", error);
    return res.status(500).json({message:"Unable to update status"});
  }
};

exports.deleteItem = async (req,res)=>{
  try {
    if(!isValidItemId(req.params.id)) {
      return res.status(400).json({message:"Invalid item id"});
    }

    const item = await Item.findById(req.params.id);

    if(!item) {
      return res.status(404).json({message:"Item not found"});
    }

    if(!canManageItem(item, req.user)) {
      return res.status(403).json({message:"You do not have permission to delete this item"});
    }

    await Item.findByIdAndDelete(req.params.id);
    await removeImage(item.image);

    return res.json({message:"Item deleted"});
  } catch (error) {
    console.error("deleteItem error:", error);
    return res.status(500).json({message:"Unable to delete item"});
  }
};
