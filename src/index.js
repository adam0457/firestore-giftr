/**
 * Student: Vladymir Adam
 * Hybrid-Assignment: Firestore-Giftr
 * mad9135 - 2022 
 */

'use strict';
import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { query, where,getFirestore, onSnapshot, collection, doc, getDocs,updateDoc, addDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';


// My client secret for fire-giftr: 05a1813516c1d972ebf11ce8cba1b7450cdfa703
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
  
  personList: document.querySelector('ul.person-list'),
  ideaList:   document.querySelector('ul.idea-list'),
  personName:   document.querySelector('#dlgPerson #name'),
  personMonth:  document.querySelector('#dlgPerson #month'),
  personDay:  document.querySelector('#dlgPerson #day'),
  giftTitle:  document.querySelector('#dlgIdea #title'),
  giftLocation: document.querySelector('#dlgIdea #location'),
  signInBtn:  document.querySelector('.signIn'),
  signOutBtn: document.querySelector('.signOut'),
  addPersonBtn: document.getElementById('btnAddPerson'),
  addIdeaBtn: document.getElementById('btnAddIdea'),

  selectedPersonId:null,
  selectedGiftId:null,
  name: null,
  month: null,
  day: null,
  people:[],
  db:null,
  auth:null,
  provider:null,
  token:null,
  sessionStorageKey:'fire-giftr-user-token',

  init: () => {
    GIFTR.addListeners();
    let app = initializeApp(GIFTR.firebaseConfig);
    GIFTR.db = getFirestore(app); 
    GIFTR.auth = getAuth();
    GIFTR.auth.languageCode = 'fr';
    GIFTR.provider = new GithubAuthProvider();
    GIFTR.provider.setCustomParameters({'allow_signup': 'true'});

    //Check if the sessionStorage has a token
    let storage = sessionStorage.getItem(GIFTR.sessionStorageKey)
    if(storage){
        GIFTR.validateWithToken(storage)
    }
  },  

  attemptLogin:()=>{
    signInWithPopup(GIFTR.auth, GIFTR.provider)
    .then((result) => {
      const credential = GithubAuthProvider.credentialFromResult(result);
      GIFTR.token = credential.accessToken;
    
      GIFTR.giveAccess();
    
      // Put the token in the sessionStorage
        sessionStorage.setItem(GIFTR.sessionStorageKey, GIFTR.token)
    
    }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GithubAuthProvider.credentialFromError(error);
    });
  },
  // I will call giveAccess when the user passes the authentication process
  giveAccess:()=>{ 
    GIFTR.getPeople();
    GIFTR.signInBtn.classList.remove('active');
    GIFTR.signOutBtn.classList.add('active');
    GIFTR.addPersonBtn.classList.add('active');
    GIFTR.addIdeaBtn.classList.add('active');
  },

  validateWithToken:(token)=>{
    const credential = GithubAuthProvider.credential(token);
    signInWithCredential(GIFTR.auth, credential)
      .then((result) => {
        
        GIFTR.giveAccess()

      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
      })
  },

  logOut:() =>{
    GIFTR.signOutBtn.classList.remove('active');
    GIFTR.signInBtn.classList.add('active');
    GIFTR.addPersonBtn.classList.remove('active');
    GIFTR.addIdeaBtn.classList.remove('active');
    sessionStorage.removeItem(GIFTR.sessionStorageKey);
    location.reload();
  },
  
  addListeners:() => {
      document.getElementById('btnCancelPerson').addEventListener('click', GIFTR.hideOverlay);
      document.getElementById('btnCancelIdea').addEventListener('click', GIFTR.hideOverlay);
      document.querySelector('.overlay').addEventListener('click', GIFTR.handleClickOutsideDlg);

      GIFTR.addPersonBtn.addEventListener('click', GIFTR.handleBtnAddPerson);
      GIFTR.addIdeaBtn.addEventListener('click', GIFTR.handleBtnAddIdea);
      document.getElementById('btnSavePerson').addEventListener('click', GIFTR.handleBtnSavePerson);
      document.getElementById('btnSaveIdea').addEventListener('click', GIFTR.handleBtnSaveIdea);
      GIFTR.personList.addEventListener('click', GIFTR.handleSelectedPerson);
      GIFTR.ideaList.addEventListener('click', GIFTR.handleSelectedIdea );

      GIFTR.signInBtn.addEventListener('click', GIFTR.attemptLogin)
      GIFTR.signOutBtn.addEventListener('click', GIFTR.logOut)
  }, 

  handleClickOutsideDlg: (ev) => {
    if(ev.target.classList.contains('overlay')){
        GIFTR.hideOverlay();
    }
  },

  handleBtnSaveIdea:(ev)=>{
    if(ev.target.hasAttribute('data-id')){ //if the save button has the attribute data-id, we will do an edit if not we will add
      GIFTR.editGiftIdea() ;
    }else{
        GIFTR.saveGiftIdea();
    }
  },

  editGiftIdea:async()=>{
      let title = document.getElementById('title').value;
      let location = document.getElementById('location').value; 
    // we're getting a reference of the current person related to the gift
      const personRef = doc(GIFTR.db, `/people/${GIFTR.selectedPersonId}`); 
      const giftIdea = {
        'idea': title,
        'location': location,
        'person-id': personRef
      };
      try{
          const collectionRef = collection(GIFTR.db, 'gift-ideas');
          const docRef = doc(collectionRef, GIFTR.selectedGiftId); //Get a reference of the current gift idea
          await setDoc(docRef, giftIdea);
          // reset the fields in the dialog after the update
          document.getElementById('title').value = '';
          document.getElementById('location').value = '';
          // hide the dialog and the overlay
          GIFTR.hideOverlay();  

      }catch(err){
        console.error('Error editing document: ', err);
      }
  },

  saveGiftIdea: async() => {
      let title = document.getElementById('title').value;
      let location = document.getElementById('location').value;
      if(!location || !title) return;
      const personRef = doc(GIFTR.db, `/people/${GIFTR.selectedPersonId}`);
      const giftIdea = {
        'idea': title,
        'location': location,
        'person-id': personRef
      };
      // console.log(`The id of the person selected is ${GIFTR.selectedPersonId}`);

      try {
        const docRef = await addDoc(collection(GIFTR.db, 'gift-ideas'), giftIdea );
        console.log('Document written with ID: ', docRef.id);
        //1. clear the form fields 
        document.getElementById('title').value = '';
        document.getElementById('location').value = '';
        //2. hide the dialog and the overlay
        GIFTR.hideOverlay();
        
        // console.log(`Idea ${title} added to database`);
        giftIdea.id = docRef.id;
        
      } catch (err) {
        console.error('Error adding document: ', err);
        
      }
      
  },

  showAddedGift: (gift) => {
    let li = document.getElementById(gift.id);
    if(li){      
      //replace the existing li with this new HTML
      li.outerHTML = `<li class="idea" data-id="">
                          <label for="chk-uniqueid"> <input type="checkbox" id="chk-uniqueid" /> Bought</label>
                          <p class="title">${gift.idea}</p>
                          <p class="location">${gift.location}</p>
                      </li>`;
    }else{
        li = `<li class="idea" data-id="">
                  <label for="chk-uniqueid"> <input type="checkbox" id="chk-uniqueid" /> Bought</label>
                  <p class="title">${gift.idea}</p>
                  <p class="location">${gift.location}</p>
              </li>`;
      document.querySelector('ul.idea-list').innerHTML += li;
  }
  },

  handleBtnSavePerson:(ev)=>{
    if(ev.target.hasAttribute('data-id')){ //if the save button has the attribute data-id, we will do an edit if not we will add
      GIFTR.editPerson() ;
    }else{
        GIFTR.savePerson();
    }
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
      
      console.log(`Person ${GIFTR.name} added to database`);
      person.id = docRef.id;      
     // The onsnapshot will update the html for me
    } catch (err) {
      console.error('Error adding document: ', err);
      
    }

  },

  hideOverlay:()=>{
    
    document.getElementById('btnSavePerson').removeAttribute('data-id');
    document.querySelector('.overlay').classList.remove('active');
    document.querySelectorAll('.overlay dialog').forEach((dialog) => dialog.classList.remove('active'));
  },

  handleBtnAddPerson: (ev) => {
    ev.preventDefault();
    GIFTR.showOverlay('addPerson');
  },

  handleBtnAddIdea: (ev) => {
    ev.preventDefault();    
    (GIFTR.selectedPersonId) ? GIFTR.showOverlay('addIdea'): alert('You have to add a person first!');
  },

  //The showOverlay will open a dialog for adding or editing a person or an idea 
  showOverlay:(action, choice)=>{     //The choice can be a person selected or an idea selected
      document.querySelector('.overlay').classList.add('active');
      //I want to check which overlay to open depending on which button has been clicked
      if(action === 'addPerson'){
        //Add the title Add Person to the h2 of the dialog
        document.querySelector('#dlgPerson h2').textContent = 'Add Person';
         // Make sure the fields are empty before adding new contents
          document.getElementById('name').value = '';
          document.getElementById('month').value = '';
          document.getElementById('day').value = '';
        document.getElementById('dlgPerson').classList.add('active');

      }else if(action === 'editPerson'){
        //Add the title Edit Person to the h2 of the dialog
        document.querySelector('#dlgPerson h2').textContent = 'Edit Person';
        document.getElementById('dlgPerson').classList.add('active');      

        //Filling the fields name, month and day with values from the choice (person) object
        GIFTR.personName.value = choice.name;
        GIFTR.personMonth.value = choice['birth-month'];
        GIFTR.personDay.value = choice['birth-day'];

        //Add a value to the data-id attribute of the save button in the dialog
        document.getElementById('btnSavePerson').setAttribute('data-id','edit');

      }else if(action === 'addIdea'){
        //Add the title Add Idea to the h2 of the dialog
        document.querySelector('#dlgIdea h2').textContent = 'Add Idea';
        // Make sure the fields are empty before adding new contents
        document.getElementById('title').value = '';
        document.getElementById('location').value = '';
        document.getElementById('dlgIdea').classList.add('active');

      }else if(action === 'editIdea'){
        //Add the title Edit Idea to the h2 of the dialog
        document.querySelector('#dlgIdea h2').textContent = 'Edit Idea';
        document.getElementById('dlgIdea').classList.add('active');
        //Retrieve the infos about the current idea to fill the fields in the dialog
        GIFTR.giftTitle.value = choice.idea;
        GIFTR.giftLocation.value = choice.location;

         //Add a value to the data-id attribute of the save button in the dialog
        document.getElementById('btnSaveIdea').setAttribute('data-id','edit');

      }
      
  },

  editPerson:async()=>{
    //Get the values from the fields to create a person object that we will pass to setDoc to update the current person
      let name = document.getElementById('name').value;
      let month = document.getElementById('month').value;
      let day = document.getElementById('day').value;      
      const person = {
        'name':name,
        'birth-month': month,
        'birth-day': day
      };
      try{
            const collectionRef = collection(GIFTR.db, 'people');
            const docRef = doc(collectionRef, GIFTR.selectedPersonId); //Get a reference of the current person
            await setDoc(docRef, person);
          
            // reset the fields in the dialog after the update
            document.getElementById('name').value = '';
            document.getElementById('month').value = '';
            document.getElementById('day').value = '';
            // hide the dialog and the overlay
            GIFTR.hideOverlay();

      }catch(err){
        console.error('Error editing document: ', err);
      }
  },

  getPeople:()=>{
      const peopleRef = collection(GIFTR.db, 'people'); //Get a reference of the collection of people
    
      onSnapshot(
        peopleRef,
        (snapshot)=>{
          console.log('the snapshot is triggered');
          GIFTR.people = []; //Empty my global list of people when the snapshot is triggered
        
          snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            GIFTR.people.push({id, ...data}); //Fill my global list of people with the updated version
          })
          GIFTR.buildPeople(GIFTR.people); //Call the buildPeople to update the html
        },
        (err)=>{console.error('something happen', err)}
      );      
  },

  getIdeas:(id)=>{
     //get an actual reference to the current person  
      const personRef = doc(collection(GIFTR.db, 'people'), id);
      //A query to get the ideas for the current person
      const giftQuery = query(collection(GIFTR.db, 'gift-ideas'),
                          where('person-id', '==', personRef)  
                        );
      //Put a onSnapshot to the query
      onSnapshot(       
        giftQuery,
        (snapshot)=>{
          console.log('the gift snapshot is triggered');
          let ideas = [];
          snapshot.forEach(doc => {
              const data = doc.data();
              const id = doc.id;
              console.log(data);
              ideas.push({id, ...data});
          });

          GIFTR.buildListIdeas(ideas);
        }
        );
  }, 
  
  buildPeople:(people)=>{ 
  if(people.length > 0){ //Testing if there's people in the collection
      let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      GIFTR.personList.innerHTML = people.map(person=>{
      const dob = `${months[person['birth-month']-1]} ${person['birth-day']}`;
      //Use the number of the birth-month less 1 as the index for the months array
      return `<li data-id="${person.id}" class="person">
              <div>
                  <p class="name">${person.name}</p>
                  <p class="dob">${dob}</p>
              </div>
              <div>
                <button class="edit" id="btn-editPerson">Edit</button>
                <button class="delete" id="btn-deletePerson">Delete</button>
              </div>    
            </li>`;
    }).join('');
    //Get the first person in the list to be automatically selected
    const firstLi = document.querySelector('.person-list li');    
    firstLi.classList.add('selected');
    // Get the ideas of the selected person to be displayed
    GIFTR.selectedPersonId = firstLi.getAttribute('data-id');
    GIFTR.getIdeas(GIFTR.selectedPersonId);    
  
  }else{
    GIFTR.personList.innerHTML = `<h3>You haven't added any person yet!!</h3>`
  }
  
  },

  handleSelectedPerson: async(ev) => {
    let selectedLi = ev.target.closest('li');
    
    // Retrieve the info of the selected person
    GIFTR.selectedPersonId = selectedLi.getAttribute('data-id');
    const collectionRef = collection(GIFTR.db, 'people');
    const docRef = doc(collectionRef, GIFTR.selectedPersonId );
    const docSnap = await getDoc(docRef);
    let selectedPerson = docSnap.data(); //This is an object that contains the info of the selected person

    // Unselect any other li in the list of people    
    let listeLi = document.querySelectorAll('.person-list li')
    listeLi.forEach(item =>  (item.classList.contains('selected')) ? item.classList.remove('selected') : "");    
    selectedLi.classList.add('selected');
    //Call the list of ideas from firestore
    GIFTR.getIdeas(GIFTR.selectedPersonId);
    
    if(ev.target.classList.contains('edit')){
      // I want to call the showOverlay function with the info of the selected person
          GIFTR.showOverlay('editPerson', selectedPerson);

    }else if(ev.target.classList.contains('delete')){      
      //Show a confirmation message before deleting the current person
      if (window.confirm("Do you really want to delete this person ?")) {
        await deleteDoc(doc(GIFTR.db, 'people', GIFTR.selectedPersonId));
      }
    }
    
  },

  handleSelectedIdea:async(ev)=>{
    let selectedLi = ev.target.closest('li');
    let ckbox = ev.target.closest('input');    

    // Retrieve the info of the current Idea
    //Put the id of the current gift in a global variable so I can access it in the editGiftIdea function
    GIFTR.selectedGiftId = selectedLi.getAttribute('data-id'); 
  
    const collectionRef = collection(GIFTR.db, 'gift-ideas');
    const docRef = doc(collectionRef, GIFTR.selectedGiftId );
    const docSnap = await getDoc(docRef);
    let currentGift = docSnap.data(); //This is an object that contains the info of the current gift    

    if(ev.target.classList.contains('edit')){
      //I want to call the showOverlay function with the info of the current gift idea
          GIFTR.showOverlay('editIdea', currentGift);

    }else if(ev.target.classList.contains('delete')){
      //Show a confirmation message before deleting the current gift idea
      if (window.confirm("Do you really want to delete this gift idea ?")) {
        await deleteDoc(doc(GIFTR.db, 'gift-ideas', GIFTR.selectedGiftId));
      }      
    }
    // Put the bought field to true or false depending on if the box is checked or unchecked
    if(ckbox) await updateDoc(docRef, {'bought':ckbox.checked});
    
  },

  
  buildListIdeas: (ideas) => {
    if(ideas.length>0){
      GIFTR.ideaList.innerHTML = ideas.map(item => {
        //I want to check if the current gift is already bought                
        let chkBoxInput = (item.bought) ? 'checked' : '';
                
        return ` <li class="idea" data-id=${item.id} >
                    
                          <label for="chk-uniqueid"> <input type="checkbox" id="chk-uniqueid" ${chkBoxInput}  /> Bought</label>
                          <p class="title">${item.idea}</p>
                          <p class="location">${item.location}</p>
                          <button class="edit" id="btn-editIdea">Edit</button>
                          <button class="delete" id="btn-deleteIdea">Delete</button>
                                  
                </li>`
      });

    }else {
          GIFTR.ideaList.innerHTML = `<h3 class="idea">No gift idea for this person!!!</h3>`
    }
    
  },
};
GIFTR.init();