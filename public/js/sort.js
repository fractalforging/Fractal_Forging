console.log("S O R T . J S   L O A D E D");

//////////////// - INITIATE SORTABLE for BREAKS- ///////////////////

window.addEventListener("load", function () {

    new Sortable(foo, {
      store: {
        // Sorting acquisition (called during initialization)
        get: function (sortable) {
          var order = localStorage.getItem("myBreakList");
          return order ? order.split('|') : [];
        },

        // Saving the acquired sorting (called each time upon sorting modification)
        set: function (sortable) {
          var order = sortable.toArray();
          localStorage.setItem("myBreakList", order.join('|'));
        }
      },
      group: 'myGroup_1',
      animation: 100
    });
});

//////////////// - INITIATE SORTABLE for QUEUE- ///////////////////

window.addEventListener("load", function () {

  new Sortable(queue, {
    store: {
      // Sorting acquisition (called during initialization)
      get: function (sortable) {
        var order = localStorage.getItem("myQueueList");
        return order ? order.split('|') : [];
      },

      // Saving the acquired sorting (called each time upon sorting modification)
      set: function (sortable) {
        var order = sortable.toArray();
        localStorage.setItem("myQueueList", order.join('|'));
      }
    },
    group: 'myGroup_2',
    animation: 100
  });
});
