$(function() {
  /* ChartJS
   * -------
   * Data and config for chartjs
   */
  'use strict';
  var barChartData = {
    labels: ["6", "5", "4", "3", "2", "1"], // Labels for past 6 days
    datasets: [{
      label: 'Income',
      data: [0, 0, 0, 0, 0, 0], // Initialize with zeros
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1,
      fill: false
    }]
  };

  var barChartOptions = {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        },
        gridLines: {
          color: "rgba(204, 204, 204,0.1)"
        }
      }],
      xAxes: [{
        gridLines: {
          color: "rgba(204, 204, 204,0.1)"
        }
      }]
    },
    legend: {
      display: false
    },
    elements: {
      point: {
        radius: 0
      }
    }
  };

  // Function to fetch past 6 days' income from the backend
  function fetchPastSixDaysIncome() {
    return $.ajax({
      url: '/api/income', // Endpoint URL to fetch income data
      method: 'GET', // HTTP method
      success: function(response) {
        // Update the data array with the fetched income values
        barChartData.datasets[0].data = response.incomeData;

        // Get the canvas element for the bar chart
        var barChartCanvas = $("#barChart").get(0).getContext("2d");

        // Update the existing bar chart with new data
        var barChart = new Chart(barChartCanvas, {
          type: 'bar',
          data: barChartData,
          options: barChartOptions
        });
      },
      error: function(xhr, status, error) {
        console.error("Error fetching income data:", error);
      }
    });
  }

  // Call the function to fetch past 6 days' income and update the chart
  fetchPastSixDaysIncome();



  
  var doughnutPieData = {
    datasets: [{
      data: [1, 2], // Initial data, assuming you have 1 COD and 2 Online Payment orders
      backgroundColor: [
        'rgba(255, 206, 86, 0.5)', // Yellow for COD
        'rgba(54, 162, 235, 0.5)'  // Blue for Online Payment
      ],
      borderColor: [
        'rgba(255, 206, 86, 1)',
        'rgba(54, 162, 235, 1)'
      ],
    }],

    // These labels appear in the legend and in the tooltips when hovering different arcs
    labels: [
      'COD',
      'Online Payment'
    ]
  };
  var doughnutPieOptions = {
    responsive: true,
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  // Function to fetch data and update chart
  function fetchDataAndUpdateChart() {
    // Make an AJAX request to your backend endpoint
    $.ajax({
      url: '/api/payment-methods', // Endpoint URL
      method: 'GET', // HTTP method
      success: function(response) {
        // Extract COD and Online Payment counts from the response
        var codCount = response.codCount;
        var onlinePaymentCount = response.onlinePaymentCount;

        // Update the doughnut chart data with the retrieved counts
        doughnutPieData.datasets[0].data = [codCount, onlinePaymentCount];

        // Get the canvas element for the doughnut chart
        var doughnutChartCanvas = $("#doughnutChart").get(0).getContext("2d");

        // Create a new Chart instance for the doughnut chart with updated data
        var doughnutChart = new Chart(doughnutChartCanvas, {
          type: 'doughnut',
          data: doughnutPieData,
          options: doughnutPieOptions
        });
      },
      error: function(xhr, status, error) {
        console.error("Error fetching data:", error);
      }
    });
  }

  // Call the function to fetch data and update chart on page load
  fetchDataAndUpdateChart();



 if ($("#barChart").length) {
    var barChartCanvas = $("#barChart").get(0).getContext("2d");
    // This will get the first returned node in the jQuery collection.
    var barChart = new Chart(barChartCanvas, {
      type: 'bar',
      data: data,
      options: options
    });
  }

  if ($("#areachart-multi").length) {
    var multiAreaCanvas = $("#areachart-multi").get(0).getContext("2d");
    var multiAreaChart = new Chart(multiAreaCanvas, {
      type: 'line',
      data: multiAreaData,
      options: multiAreaOptions
    });
  }

  if ($("#doughnutChart").length) {
    var doughnutChartCanvas = $("#doughnutChart").get(0).getContext("2d");
    var doughnutChart = new Chart(doughnutChartCanvas, {
      type: 'doughnut',
      data: doughnutPieData,
      options: doughnutPieOptions
    });
  }



});