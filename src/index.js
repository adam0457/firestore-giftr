/**
 * Student: Vladymir Adam
 * Hybrid-Assignment: Firestore-Giftr
 * mad9135 - 2022 
 */

'use strict';
import { initializeApp } from 'firebase/app';
import { query, where,getFirestore, collection, doc, getDocs, addDoc } from 'firebase/firestore';

const GIFTR = {
   /** My global variables */  
  firebaseConfig:{
    apiKey: "AIzaSyDKvKz18ehgFqqQFsGYCF0Si_FMZgE6ZIM",
    authDomain: "fire-giftr-cad6e.firebaseapp.com",
    projectId: "fire-giftr-cad6e",
    storageBucket: "fire-giftr-cad6e.appspot.com",
    messagingSenderId: "416768678849",
    appId: "1:416768678849:web:77f6c29fec81803b46ed40"
  },
  personList:document.querySelector('ul.person-list'),
  ideaList: document.querySelector('ul.idea-list'),
  name: null,
  month: null,
  day: null,
  people:[],
  db:null,
  init: () => {
    GIFTR.addListeners();
    let app = initializeApp(GIFTR.firebaseConfig);
    GIFTR.db = getFirestore(app); 
    GIFTR.getPeople();
  },  
  
  addListeners:() => {
      document.getElementById('btnCancelPerson').addEventListener('click', GIFTR.hideOverlay);
      document.getElementById('btnCancelIdea').addEventListener('click', GIFTR.hideOverlay);
      // document.querySelector('.overlay').addEventListener('click', GIFTR.hideOverlay);

      document.getElementById('btnAddPerson').addEventListener('click', GIFTR.showOverlay);
      document.getElementById('btnAddIdea').addEventListener('click', GIFTR.showOverlay);
      document.getElementById('btnSavePerson').addEventListener('click', GIFTR.savePerson);
      GIFTR.personList.addEventListener('click', GIFTR.showListGifts);
  }, 
  
  savePerson: async(ev) => {
    GIFTR.name = document.getElementById('name').value;
    GIFTR.month = document.getElementById('month').value;
    GIFTR.day = document.getElementById('day').value;
    if(!GIFTR.name || !GIFTR.month || !GIFTR.day) return;
    const person = {
      'name': GIFTR.name,
      'birth-month': GIFTR.month,
      'birth-day': GIFTR.day
    };

    try {
      const docRef = await addDoc(collection(GIFTR.db, 'people'), person );
      console.log('Document written with ID: ', docRef.id);
      //1. clear the form fields 
      document.getElementById('name').value = '';
      document.getElementById('month').value = '';
      document.getElementById('day').value = '';
      //2. hide the dialog and the overlay
      GIFTR.hideOverlay();
      //3. display a message to the user about success 
      // tellUser(`Person ${GIFTR.name} added to database`);
      console.log(`Person ${GIFTR.name} added to database`);
      person.id = docRef.id;
      //4. ADD the new HTML to the <ul> using the new object
      GIFTR.showPerson(person);
    } catch (err) {
      console.error('Error adding document: ', err);
      //do you want to stay on the dialog?
      //display a mesage to the user about the problem
    }

  },

  showPerson: (person) => {
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let li = document.getElementById(person.id);
    if(li){
      //update on screen
      const dob = `${months[person['birth-month']-1]} ${person['birth-day']}`;
      //Use the number of the birth-month less 1 as the index for the months array
      //replace the existing li with this new HTML
      li.outerHTML = `<li data-id="${person.id}" class="person">
              <p class="name">${person.name}</p>
              <p class="dob">${dob}</p>
            </li>`;
    }else{
      //add to screen
      const dob = `${months[person['birth-month']-1]} ${person['birth-day']}`;
      //Use the number of the birth-month less 1 as the index for the months array
      li = `<li data-id="${person.id}" class="person">
              <p class="name">${person.name}</p>
              <p class="dob">${dob}</p>
            </li>`;
      document.querySelector('ul.person-list').innerHTML += li;
  }
  },

  hideOverlay:(ev)=>{
    // ev.preventDefault();
    document.querySelector('.overlay').classList.remove('active');
    document.querySelectorAll('.overlay dialog').forEach((dialog) => dialog.classList.remove('active'));
  },

  showOverlay:(ev)=>{
      ev.preventDefault();
      document.querySelector('.overlay').classList.add('active');
      const id = ev.target.id === 'btnAddPerson' ? 'dlgPerson' : 'dlgIdea';
      //TODO: check that person is selected before adding an idea
      document.getElementById(id).classList.add('active');
  },

  getPeople:async()=>{
      const querySnapshot = await getDocs(collection(GIFTR.db, 'people'));
      querySnapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      GIFTR.people.push({id, ...data});
  });
  GIFTR.buildPeople(GIFTR.people);
  },

  buildPeople:(people)=>{  
  let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  GIFTR.personList.innerHTML = people.map(person=>{
    const dob = `${months[person['birth-month']-1]} ${person['birth-day']}`;
    //Use the number of the birth-month less 1 as the index for the months array
    return `<li data-id="${person.id}" class="person">
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
          </li>`;
  }).join('');
  },

  showListGifts: (ev) => {
    let selectedPerson = ev.target.closest('li');
    let selectedPersonId = selectedPerson.getAttribute('data-id');    
    let listeLi = document.querySelectorAll('.person-list li')
    listeLi.forEach(item =>  (item.classList.contains('selected')) ? item.classList.remove('selected') : "");    
    selectedPerson.classList.add('selected');
    //Call the list of ideas from firestore
    GIFTR.getIdeas(selectedPersonId);
  },
  getIdeas: async(id)=>{
          //get an actual reference to the person document 
      const personRef = doc(collection(GIFTR.db, 'people'), id);
      //then run a query where the `person-id` property matches the reference for the person
      const docs = query(
        collection(GIFTR.db, 'gift-ideas'),
        where('person-id', '==', personRef)
      );
      const querySnapshot = await getDocs(docs);
      let ideas = [];

      querySnapshot.forEach((doc) => { 
        //work with the resulting docs
        const data = doc.data();
        const id = doc.id;
        ideas.push({id, ...data});
      });

      GIFTR.buildListIdeas(ideas);
  },
  buildListIdeas: (ideas) => {
    GIFTR.ideaList.innerHTML = ideas.map(item => {
      return ` <li class="idea" data-id="">
                    <label for="chk-uniqueid"> <input type="checkbox" id="chk-uniqueid" /> Bought</label>
                    <p class="title">${item.idea}</p>
                    <p class="location">${item.location}</p>
              </li>`
    });
  },
};
GIFTR.init();