const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to mongoDB server
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("item", itemsSchema);

const food = new Item ({
  name: "Buy Food"
});

const eat = new Item ({
  name: "Eat Food"
});

const code = new Item ({
  name: "Start Coding"
});

const defaultItem = [food, eat, code];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, items){
    //check if array items length is equal 0 and then insert the document
    if(items.length === 0){
      Item.insertMany(defaultItem, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Succesfully Insert Items")
        }
      })
      res.redirect('/')
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });

});

//dynamic page using route paramaters
app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundItem){
    if(!err){
      if(!foundItem){
        // Create new doc if foundItem doesn't exists
        const list = new List({
          name: customListName,
          items: defaultItem
        });
      
        list.save()
        res.redirect("/" + customListName)
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundItem.name, newListItems: foundItem.items})
      }
    }  
  })

})

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list

  const addItem = new Item({
    name: item
  });

  if(listName === "Today"){
    addItem.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(addItem)
      foundList.save()
      res.redirect("/" + listName);
    })
  }

  console.log(req.body)

});

app.post("/delete", function(req, res){

  const idItem = req.body.checkbox
  const listName = req.body.listName

  if(listName === "Today"){
    Item.findByIdAndRemove(idItem, function(err){
      if(err){
        console.log(err)
      } else {
        console.log("Succesfully Delete Item!")
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:  {_id: idItem}}}, function(err){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }

  

})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
