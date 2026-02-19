const Item = require("../models/Item");

exports.createItem = async (req,res)=>{
  const item = await Item.create({
    ...req.body,
    user_id:req.user.id,
    image:req.file?.filename
  });

  res.json(item);
};

exports.getItems = async (req,res)=>{
  const items = await Item.find().populate("user_id","name email");
  res.json(items);
};

exports.approveItem = async (req,res)=>{
  const item = await Item.findByIdAndUpdate(
    req.params.id,
    {status:"approved"},
    {new:true}
  );
  res.json(item);
};
