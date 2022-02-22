let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  // save a reference to the database
  let db = target.result;
  // create an object store (table) called `pending`, set it to have an auto incrementing primary key of sorts
  db.createObjectStore("pending", { autoIncrement: true });
};

// upon a successful
request.onsuccess = ({ target }) => {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Something went wrong! " + event.target.errorCode);
};

// save infos if there is no connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["pending"], "readwrite");

  // access the object store for `pending`
  const store = transaction.objectStore("pending");

  // get all
  const getAll = store.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["pending"], "readwrite");
          // access the pending object store
          const store = transaction.objectStore("pending");
          // clear all items in your store
          store.clear();

          alert("All transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
