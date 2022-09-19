/**
 * Student: Vladymir Adam
 * Hybrid-Assignment: Firestore-Giftr
 * mad9135 - 2022 
 */

'use strict';
import { initializeApp } from 'firebase/app';
import { query, where,getFirestore, onSnapshot, collection, doc, getDocs, addDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

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
  personName: document.querySelector('#dlgPerson #name'),
  personMonth: document.querySelector('#dlgPerson #month'),
  personDay: document.querySelector('#dlgPerson #day'),
  giftTitle: document.querySelector('#dlgIdea #title'),
  giftLocation:document.querySelector('#dlgIdea #location'),
  selectedPersonId:null,
  selectedGiftId:null,
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
    // GIFTR.getInitListPeople();
  },  
  
  addListeners:() => {
      document.getElementById('btnCancelPerson').addEventListener('click', GIFTR.hideOverlay);
      document.getElementById('btnCancelIdea').addEventListener('click', GIFTR.hideOverlay);
      // document.querySelector('.overlay').addEventListener('click', GIFTR.hideOverlay);

      document.getElementById('btnAddPerson').addEventListener('click', GIFTR.handleBtnAddPerson);
      document.getElementById('btnAddIdea').addEventListener('click', GIFTR.handleBtnAddIdea);
      document.getElementById('btnSavePerson').addEventListener('click', GIFTR.handleBtnSavePerson);
      document.getElementById('btnSaveIdea').addEventListener('click', GIFTR.handleBtnSaveIdea);
      // document.getElementById('btn-editPerson').addEventListener('click', GIFTR.showEditDialog);
      GIFTR.personList.addEventListener('click', GIFTR.handleSelectedPerson);
      GIFTR.ideaList.addEventListener('click', GIFTR.handleSelectedIdea );
  }, 

  showEditDialog:(ev)=>{
    console.log('this is a test to edit');
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
      console.log(`The id of the person selected is ${GIFTR.selectedPersonId}`);

      try {
        const docRef = await addDoc(collection(GIFTR.db, 'gift-ideas'), giftIdea );
        console.log('Document written with ID: ', docRef.id);
        //1. clear the form fields 
        document.getElementById('title').value = '';
        document.getElementById('location').value = '';
        //2. hide the dialog and the overlay
        GIFTR.hideOverlay();
        //3. display a message to the user about success 
        // tellUser(`Person ${GIFTR.name} added to database`);
        console.log(`Idea ${title} added to database`);
        giftIdea.id = docRef.id;
        //4. ADD the new HTML to the <ul> using the new object
        // GIFTR.showPerson(person);
        //GIFTR.showAddedGift(giftIdea);
      } catch (err) {
        console.error('Error adding document: ', err);
        //do you want to stay on the dialog?
        //display a mesage to the user about the problem
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
      //3. display a message to the user about success 
      // tellUser(`Person ${GIFTR.name} added to database`);
      console.log(`Person ${GIFTR.name} added to database`);
      person.id = docRef.id;
      //4. ADD the new HTML to the <ul> using the new object
     // GIFTR.showPerson(person); 
     //I no longer need the showPerson to display the newly added person because the onsnapshot is doing the job for me
    } catch (err) {
      console.error('Error adding document: ', err);
      //do you want to stay on the dialog?
      //display a mesage to the user about the problem
    }

  },

  // showPerson: (person) => {
  //   let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  //   let li = document.getElementById(person.id);
  //   if(li){
  //     //update on screen
  //     const dob = `${months[person['birth-month']-1]} ${person['birth-day']}`;
  //     //Use the number of the birth-month less 1 as the index for the months array
  //     //replace the existing li with this new HTML
  //     li.outerHTML = `<li data-id="${person.id}" class="person">
  //                       <div>
  //                           <p class="name">${person.name}</p>
  //                           <p class="dob">${dob}</p>
  //                       </div>
  //                       <div>
  //                       <button class="edit" id="btn-editPerson">Edit</button>
  //                       <button class="delete" id="btn-deletePerson">Delete</button>
  //                     </div> 
  //                     </li>`;
  //   }else{
  //     //add to screen
  //     const dob = `${months[person['birth-month']-1]} ${person['birth-day']}`;
  //     //Use the number of the birth-month less 1 as the index for the months array
  //     li = `<li data-id="${person.id}" class="person">
  //               <div>
  //                   <p class="name">${person.name}</p>
  //                   <p class="dob">${dob}</p>
  //               </div>
  //               <div>
  //                   <button class="edit" id="btn-editPerson">Edit</button>
  //                   <button class="delete" id="btn-deletePerson">Delete</button>
  //               </div> 
  //           </li>`;
  //     document.querySelector('ul.person-list').innerHTML += li;
  // }
  // },

  hideOverlay:(ev)=>{
    // ev.preventDefault();
    //remove the data-id attribute from the save button in the dialog
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
    GIFTR.showOverlay('addIdea');
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
      //const id = ev.target.id === 'btnAddPerson' ? 'dlgPerson' : 'dlgIdea';
      //TODO: check that person is selected before adding an idea
     // document.getElementById(id).classList.add('active');
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

  /*----- The initial getIdeas --------*/

// getIdeas: async(id)=>{
//     //get an actual reference to the person document 
//       const personRef = doc(collection(GIFTR.db, 'people'), id);
//       //then run a query where the `person-id` property matches the reference for the person
//       const docs = query(
//         collection(GIFTR.db, 'gift-ideas'),
//         where('person-id', '==', personRef)
//       );
//       const querySnapshot = await getDocs(docs);
//       let ideas = [];

//       querySnapshot.forEach((doc) => { 
//         //work with the resulting docs
//         const data = doc.data();
//         const id = doc.id;
//         ideas.push({id, ...data});
//       });
//       // console.log(ideas);

//       GIFTR.buildListIdeas(ideas);
// },
  
  buildPeople:(people)=>{  
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
    
  },

  handleBtnEditIdea:(ev)=>{
      console.log(ev.target);
  },
  
  buildListIdeas: (ideas) => {
    GIFTR.ideaList.innerHTML = ideas.map(item => {
      return ` <li class="idea" data-id=${item.id} >
                  
                        <label for="chk-uniqueid"> <input type="checkbox" id="chk-uniqueid" /> Bought</label>
                        <p class="title">${item.idea}</p>
                        <p class="location">${item.location}</p>
                        <button class="edit" id="btn-editIdea">Edit</button>
                        <button class="delete" id="btn-deleteIdea">Delete</button>
                                
              </li>`
    });
  },
};
GIFTR.init();