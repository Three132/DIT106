const console = { log: ()=>{} , error: ()=>{ } };
const initializeApp = () => {};
const getAuth = () => ({});
const getFirestore = () => ({});
const GoogleAuthProvider = function() {};
const signInWithPopup = () => {};
const signOut = () => {};
const onAuthStateChanged = () => {};
const collection = () => {};
const addDoc = () => {};
const deleteDoc = () => {};
const doc = () => {};
const query = () => {};
const where = () => {};
const onSnapshot = () => {};
const orderBy = () => {};
const serverTimestamp = () => {};

const document = {
  getElementById: (id) => {
    return {
      addEventListener: () => {},
      style: {},
      classList: { add: ()=>{}, remove: ()=>{} },
      value: '',
      checked: false,
      querySelector: () => ({ className: '', style: {} })
    };
  },
  createElement: () => ({ classList: { add: ()=>{} }, innerHTML: '' }),
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'light'
  }
};
const localStorage = { getItem: () => null, setItem: () => {} };
const Chart = { register: () => {} };
const window = {};
const setInterval = () => {};
const setTimeout = () => {};
