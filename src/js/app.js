App = {
  web3Provider: null,
  contracts: {},
  likes: {}, // Track likes for each pet

  init: async function () {
    // Initialize pets and chat area
    $.getJSON('../pets.json', function (data) {
      const petsRow = $('#petsRow');
      const petTemplate = $('#petTemplate');

      data.forEach((pet, i) => {
        petTemplate.find('.panel-title').text(pet.name);
        petTemplate.find('img').attr('src', pet.picture);
        petTemplate.find('.pet-breed').text(pet.breed);
        petTemplate.find('.pet-age').text(pet.age);
        petTemplate.find('.pet-location').text(pet.location);
        petTemplate.find('.btn-adopt').attr('data-id', pet.id);
        petTemplate.find('.btn-like').attr('data-id', pet.id);
        petTemplate.find('.like-count').text(App.likes[pet.id] || 0);

        petsRow.append(petTemplate.html());
      });
    });

    App.initComments();
    await App.initWeb3();
    return App.initContract();
  },

  initComments: function () {
    const commentsContainer = $('#commentsContainer');
    const commentForm = $('#commentForm');

    // Preload comments
    const preloadedComments = [
      "This is an amazing pet shop!",
      "I adopted my dog from here, and it was the best experience!",
      "Highly recommend Pete's Pet Shop for pet lovers!",
      "The staff is so helpful and caring!"
    ];

    // Function to add a comment with rolling animation
    function addComment(commentText, index) {
      const commentDiv = $('<div></div>').addClass('comment-item');
      commentDiv.text(commentText);

      // Assign rolling animation class
      if (index % 2 === 0) {
        commentDiv.addClass('even-comment');
      } else {
        commentDiv.addClass('odd-comment');
      }

      commentsContainer.append(commentDiv);
    }

    // Load preloaded comments
    preloadedComments.forEach((comment, index) => {
      addComment(comment, index);
    });

    // Handle new comment submission
    commentForm.on('submit', function (e) {
      e.preventDefault();

      const userName = $('#userName').val().trim();
      const userComment = $('#userComment').val().trim();

      if (userName && userComment) {
        const newComment = `${userName}: ${userComment}`;
        const index = commentsContainer.children().length;

        addComment(newComment, index);
        commentForm[0].reset(); // Clear the form
      }
    });
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error('User denied account access');
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
  },

  initContract: function () {
    $.getJSON('Adoption.json', function (data) {
      const AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      App.contracts.Adoption.setProvider(App.web3Provider);

      App.markAdopted();
    });

    $.getJSON("SendMeEther.json", function (data) {
      // Get the contract artifact file and instantiate it with @truffle/contract
      var SendMeEtherArtifact = data;
      App.contracts.SendMeEther = TruffleContract(SendMeEtherArtifact);

      // Set the provider for the contract
      App.contracts.SendMeEther.setProvider(App.web3Provider);
    });

    App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-like', App.handleLike);
    $(document).on('click', '#sendMessageBtn', App.handleChatMessage);
    $(document).on("click", ".btn-donate", App.handleDonation);
    $(document).on('keypress', '#chatInput', function (event) {
      if (event.which === 13) {
        App.handleChatMessage();
      }
    });
  },

  markAdopted: function () {
    var adoptionInstance;

    App.contracts.Adoption.deployed()
      .then(function (instance) {
        adoptionInstance = instance;
        return adoptionInstance.getAdopters.call();
      })
      .then(function (adopters) {
        for (let i = 0; i < adopters.length; i++) {
          if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
            $('.panel-pet')
              .eq(i)
              .find('button.btn-adopt')
              .text('Success')
              .attr('disabled', true);
          }
        }
      })
      .catch(function (err) {
        console.error('Error in markAdopted:', err.message);
      });
  },

  handleAdopt: function (event) {
    event.preventDefault();
    const petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.error(error);
      }

      const account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;
          return adoptionInstance.adopt(petId, { from: account });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.error('Error in handleAdopt:', err.message);
        });
    });
  },

  // handleLike: function (event) {
  //   event.preventDefault();
  //   const petId = parseInt($(event.target).data('id'));

  //   // Increment the like count for this pet
  //   if (!App.likes[petId]) {
  //     App.likes[petId] = 0;
  //   }
  //   App.likes[petId]++;

  //   // Update the like count in the UI
  //   $(event.target).siblings('.like-count').text(App.likes[petId]);
  // },

  handleLike: function (event) {
    event.preventDefault();
    const petId = parseInt($(event.target).data('id'));
    const likeButton = $(event.target); // Get the clicked button
  
    // Toggle the "liked" state
    if (!App.likes[petId]) {
      App.likes[petId] = 0; // Initialize like count if not already set
    }
  
    if (likeButton.hasClass('liked')) {
      // If already liked, unlike it
      App.likes[petId]--;
      likeButton.removeClass('liked'); // Remove the "liked" class
    } else {
      // If not liked, like it
      App.likes[petId]++;
      likeButton.addClass('liked'); // Add the "liked" class
    }
  
    // Update the like count in the UI
    likeButton.siblings('.like-count').text(App.likes[petId]);
  },

  handleDonation: function (event) {
    // console.log("ok");
    event.preventDefault();
    var amount = web3.toWei(0.1, "ether"); // Change the amount to your desired value
    var sendMeEtherInstance;0

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SendMeEther.deployed().then(function (instance) {
        sendMeEtherInstance = instance;

        // Send Ether to the contract using the receiveEther function
        return sendMeEtherInstance.receiveEther({
          from: account,
          value: amount
        });
      }).then(function (result) {
        // Optionally, update UI or perform actions after donation
        console.log("Donation successful:", result);
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },

  
  // handleDonation: function (event) {
  //   event.preventDefault();
  //   console.log("Donate button clicked!");
  // },
  


  handleChatMessage: async function () {
    const chatMessages = $('#chatMessages');
    const chatInput = $('#chatInput');
    const message = chatInput.val().trim();

    if (message) {
      // Display user message
      const userMessage = `<div><strong>You:</strong> ${message}</div>`;
      chatMessages.append(userMessage);

      // Clear the input field
      chatInput.val('');
      chatMessages.scrollTop(chatMessages[0].scrollHeight);

      try {
        // Send message to LLM API
        const response = await App.callLLM(message);

        // Display LLM's response
        const responseMessage = `<div><strong>Bot:</strong> ${response}</div>`;
        chatMessages.append(responseMessage);
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
      } catch (error) {
        const errorMessage = `<div><strong>Bot:</strong> Sorry, something went wrong. Please try again later.</div>`;
        chatMessages.append(errorMessage);
        console.error('Error communicating with LLM:', error);
      }
    }
  },

  callLLM: async function (message) {
    const apiKey = ''; // Replace this with your OpenAI API key
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
      model: 'gpt-3.5-turbo', 
      messages: [{ role: 'user', content: message }],
      max_tokens: 150,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to fetch response from LLM');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in callLLM:', error.message);
      throw error;
    }
  },
};

$(function () {
  $(window).on('load', function () {
    App.init();
  });
});
