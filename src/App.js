import './App.css';
// import Gun from 'gun'
import React,{useEffect, useState, useRef } from 'react'
import ReactDOM from "react-dom";
import {Button} from "@material-ui/core"
import Gun from "gun";
require("gun/sea"); //
require("webrtc");
require("gun/lib/open");
require("gun/lib/load");
const $ = require("jquery");

const gun = Gun({
  peers: ['http:localhost:8000/gun']
})

function App() {

  const [txt, setTxt] = useState()

  useEffect(() => {
   
    gun.get('text').once((node) => {
      console.log(node)
      if(node == undefined) {
        gun.get('text').put({text: "Write the text here"})
      } else {
        console.log("Found Node")
        setTxt(node.text)
      }

    //   gun.get("myAnimals").open((data) => {
    //     const animals = Object.values(data)
    //       // filter out deleted values which will appear as null
    //       .filter((item) => !!item);
  
    //     // update local state which will be rendered
    //     setItems(animals);
    // })

    gun.get("myAnimals").open((data) => {
      const animals = Object.values(data)
        // filter out deleted values which will appear as null
        .filter((item) => !!item && !!item.name);

      // update local state which will be rendered
      setItems(animals);
    });
    return () => {
      // this is the "unmount" part; we want to stop listening to updates
      // coming on this stream after the component is unmounted
      gun.get("myAnimals").off();
    };
  }, []);
    gun.get('text').on((node) => {
      console.log("Receiving Update")
      console.log(node)
      setTxt(node.text)
    })
  }, [])

  const updateText = (event) => {
    console.log("Updating Text")
    console.log(event.target.value)
    gun.get('text').put({text: event.target.value})
    setTxt(event.target.value)
  }


  const [items, setItems] = useState([]);
  const inputRef = useRef();
  const [filteredItems, setFilteredItems] = useState([]);

  // const handleSubmit = () => {
  //   const name = inputRef.current.value;
  //   const randomId = `id_${Date.now()}`;
  //   gun.get("myAnimals").get(randomId).put({ name, id: randomId });
  //   inputRef.current.value = "";
  // };

  // const handleDelete = (id) => () => {
  //   // in Gun you delete by setting the node to null
  //   gun.get("myAnimals").get(id).put(null);
  // };

  const handleSubmit = () => {
    const name = inputRef.current.value.trim();
    const randomId = `id_${Date.now()}`;
    const nodeReference = gun
      .get("myAnimals")
      .get(randomId)
      .put({ name, id: randomId });

    const animalIndexNode = gun.get("myAnimalsTextIndex");

    name.split(/\s{1,}/gi).forEach((part) => {
      animalIndexNode.get(part).get(randomId).put(nodeReference);
    });

    inputRef.current.value = "";
  };

  const handleDelete = (id) => () => {
    // in Gun you delete by setting the node to null
    gun.get("myAnimals").get(id).put(null);
  };

  var user = gun.user();

  $("#up").on("click", function(e) {
    user.create($("#alias").val(), $("#pass").val(), ack => {
      console.log(ack);
    });
  });

  $("#sign").on("submit", function(e) {
    e.preventDefault();
    user.auth($("#alias").val(), $("#pass").val());
  });

  $("#said").on("submit", function(e) {
    e.preventDefault();
    if (!user.is) {
      return;
    }
    user.get("said").set($("#say").val());
    $("#say").val("");
  });

  function UI(say, id) {
    var li =
      $("#" + id).get(0) ||
      $("<li>")
        .attr("id", id)
        .appendTo("ul");
    $(li).text(say);
  }

  gun.on("auth", function() {
    $("#sign").hide();
    user
      .get("said")
      .map()
      .once(UI);
  });

  const handleSearch = (e) => {
    if (e.target.value) {
      gun
        .get("myAnimalsTextIndex")
        .get({ ".": { "*": e.target.value } })
        .load((data) => {
          const filteredAnimals = Object.values(data)
            // filter out deleted values which will appear as null
            .filter((item) => !!item && !!item.name);

          // update local state which will be rendered
          setFilteredItems(filteredAnimals);
        });
    } else {
      setFilteredItems([]);
    }
  };
  return (
    <div className="App">
      <h1>Collaborative Document With GunJS</h1>
      <textarea value = {txt} onChange = {updateText}/>

      <div>
        <input ref={inputRef} />
        <button onClick={handleSubmit}>CREATE ITEM</button>
        <h3>Total items: {items.length}</h3>
        <ul>
          {items.map((animal) => (
            <li key={animal.id}>
              {animal.name} ({animal.id})
              <button onClick={handleDelete(animal.id)}>X</button>
            </li>
          ))}
        </ul>

        <div>
          Search: <input onChange={handleSearch} />
          <ul>
            Filtered items ({filteredItems.length}):
            {filteredItems.map((animal) => (
              <li key={animal.id}>{animal.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <form id="sign">
        <input id="alias" placeholder="please enter user name" />
        <br />
        <input id="pass" type="password" placeholder="Please enter the password" />
        <br />
        <input id="in" type="submit" value="Log in" />
        <input id="up" type="button" value="Register" />
      </form>
      <ul />

      <form id="said">
        <input id="say" />
        <input id="speak" type="submit" value="Speak" />
      </form>
      <Button variant="contained" color="primary">
        Hello World
      </Button>
    </div>
    
    
  );
}

export default App;
