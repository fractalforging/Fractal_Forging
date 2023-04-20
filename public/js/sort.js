console.log("S O R T . J S   L O A D E D");

//////////////// - INITIATE SORTABLE for BREAKS- ///////////////////

window.addEventListener("load", function () {

  try {
    new Sortable(foo, {
      store: {
        get: function (sortable) {
          var order = localStorage.getItem("myBreakList");
          return order ? order.split('|') : [];
        },
        set: function (sortable) {
          var order = sortable.toArray();
          localStorage.setItem("myBreakList", order.join('|'));
        }
      },
      group: 'myGroup_1',
      animation: 100
    });

    new Sortable(queue, {
      store: {
        get: function (sortable) {
          var order = localStorage.getItem("myQueueList");
          return order ? order.split('|') : [];
        },
        set: function (sortable) {
          var order = sortable.toArray();
          localStorage.setItem("myQueueList", order.join('|'));
        }
      },
      group: 'myGroup_2',
      animation: 100
    });
  } catch (err) { }

});


window.addEventListener("load", function () {
  try {
    new Sortable(agents, {
      store: {
        get: function (sortable) {
          var order = localStorage.getItem("myAgentList");
          return order ? order.split('|') : [];
        },
        set: function (sortable) {
          var order = sortable.toArray();
          localStorage.setItem("myAgentList", order.join('|'));
        }
      },
      group: 'myGroup_3',
      animation: 100
    });
    new Sortable(sFunctions, {
      store: {
        get: function (sortable) {
          var order = localStorage.getItem("mysFunctionsList");
          return order ? order.split('|') : [];
        },
        set: function (sortable) {
          var order = sortable.toArray();
          localStorage.setItem("mysFunctionsList", order.join('|'));
        }
      },
      group: 'myGroup_4',
      animation: 100
    });
  } catch (err) { }
});