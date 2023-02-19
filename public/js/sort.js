window.addEventListener("load", function () {

    new Sortable(foo, {
      store: {
        // Sorting acquisition (called during initialization)
        get: function (sortable) {
          var order = localStorage.getItem("myTestList1");
          return order ? order.split('|') : [];
        },

        // Saving the acquired sorting (called each time upon sorting modification)
        set: function (sortable) {
          var order = sortable.toArray();
          localStorage.setItem("myTestList1", order.join('|'));
        }
      },
      group: 'myGroup',
      animation: 100
    });
});

console.log("SORT LOADED")