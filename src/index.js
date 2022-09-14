'use strict';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs } from 'firebase/firestore';

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
  people:[],
  db:null,
  init: () => {
    GIFTR.addListeners();
    let app = initializeApp(GIFTR.firebaseConfig);
    GIFTR.db = getFirestore(app); 
    GIFTR.getPeople();
  },
  // app : initializeApp(GIFTR.firebaseConfig),
  // db : getFirestore(GIFTR.app), 
  
  addListeners:() => {
        document.getElementById('btnCancelPerson').addEventListener('click', GIFTR.hideOverlay);
      document.getElementById('btnCancelIdea').addEventListener('click', GIFTR.hideOverlay);
      document.querySelector('.overlay').addEventListener('click', GIFTR.hideOverlay);

      document.getElementById('btnAddPerson').addEventListener('click', GIFTR.showOverlay);
      document.getElementById('btnAddIdea').addEventListener('click', GIFTR.showOverlay);
      GIFTR.personList.addEventListener('click', GIFTR.showListGifts);
  },  

  hideOverlay:(ev)=>{
      ev.preventDefault();
    document.querySelector('.overlay').classList.remove('active');
    document
      .querySelectorAll('.overlay dialog')
      .forEach((dialog) => dialog.classList.remove('active'));
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
  // let ul = document.querySelector('ul.person-list');  
  let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // ul.innerHTML = people.map(person=>{
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
    console.log(ev.target.closest('li').getAttribute('data-id'));
  }
};
GIFTR.init();