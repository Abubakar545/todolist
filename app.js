//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
var mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Abubakar_siddiq:Abu45%40Atlas@cluster0.nkl5dt3.mongodb.net/todolistDB', { useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Welcome to your todolist!"
})

const item2 = new Item({
  name : "Hit the + button to add a new item."
})

const item3 = new Item({
  name : "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

// const day = date.getDate();
Item.find({}).then(function(foundItems){

if(foundItems.length === 0){
  Item.insertMany(defaultItems)
        .then(function () {
          console.log("Successfully saved defult items to DB");
        })
        .catch(function (err) {
          console.log(err);
        });
        res.redirect("/");
}else{
   res.render("list", {listTitle: "Today", newListItems:foundItems});
}
});
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    try {
      await item.save();
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving item.");
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving item to the list.");
    }
  }
});

// ... (previous code)

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);


  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems // Make sure to define 'defaultItems' elsewhere in your code
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error(err);
  }
});


app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log('Successfully deleted checked item.');
      res.redirect('/');
    } else {
      const updatedList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } },
        { new: true } // This option returns the updated document
      );
      if (updatedList) {
        res.redirect("/" + listName);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting the item.");
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
