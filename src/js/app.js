App = {
  web3Provider: null,
  contracts: {},
  likes: {},

  projectTemplate: {
    overview: "Welcome to our pet adoption website! Here, we showcase some adorable animals that are looking for a loving home. Our goal is to use blockchain technology to make the pet adoption process safer, easier, and more transparent, helping these wonderful animals find the perfect families.",
    principles: [
      "Each pet we feature has a unique background and personality. You can choose the one that best fits your lifestyle.",
      "Each pet has detailed information about their name, age, breed, and location, so you can get to know them better before adopting.",
      "Our adoption process is simple and straightforward. Just choose your pet, complete the easy transaction, and the pet becomes a part of your family.",
      "We believe every pet deserves a loving home, and we want to make it easy for you to give that home.",
      "Let’s work together to give these animals the care, love, and future they deserve!"
    ],
    guidance: "Feel free to ask anything about the pets in the chat box! Whether it's their name, age, breed, or the adoption process, we're here to help you. Whether you're already in love with one of our pets or still thinking about it, we're happy to chat and help you find the perfect match."
  },

  petsData: [
    { id: 1, name: "Frieda", breed: "Scottish Terrier", age: 3, location: "Lisco, Alabama", likes: 0 },
    { id: 2, name: "Gina", breed: "Scottish Terrier", age: 3, location: "Tooleville, West Virginia", likes: 0 },
    { id: 3, name: "Collins", breed: "French Bulldog", age: 2, location: "Freeburn, Idaho", likes: 0 },
    { id: 4, name: "Melissa", breed: "Boxer", age: 2, location: "Camas, Pennsylvania", likes: 0 },
    { id: 5, name: "Jeanine", breed: "French Bulldog", age: 2, location: "Gerber, South Dakota", likes: 0 },
    { id: 6, name: "Elvia", breed: "French Bulldog", age: 3, location: "Innsbrook, Illinois", likes: 0 },
    { id: 7, name: "Latisha", breed: "Golden Retriever", age: 3, location: "Soudan, Louisiana", likes: 0 },
    { id: 8, name: "Coleman", breed: "Golden Retriever", age: 3, location: "Jacksonwald, Palau", likes: 0 },
    { id: 9, name: "Kristina", breed: "Golden Retriever", age: 4, location: "Sultana, Massachusetts", likes: 0 },
    { id: 10, name: "Ethel", breed: "Golden Retriever", age: 2, location: "Broadlands, Oregon", likes: 0 },
    { id: 11, name: "Terry", breed: "Golden Retriever", age: 2, location: "Dawn, Wisconsin", likes: 0 }
  ],

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
        petTemplate.find(".btn-return").attr("data-id", pet.id);
        petTemplate.find('.btn-like').attr('data-id', pet.id);
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

    // Load preloaded comments
    preloadedComments.forEach((comment, index) => {
      App.addComment(comment, index, commentsContainer);
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
    $(document).on("click", ".btn-return", App.handleReturn);
    $(document).on('keypress', '#chatInput', function (event) {
      if (event.which === 13) {
        App.handleChatMessage();
      }
    });
    $(document).on('click', '#sendMessageBtn', App.handleChatMessage);
    $(document).on('click', '#askMessageBtn', App.handleAskChatMessage);
    $(document).on("click", ".btn-donate", App.handleDonation);
    $(document).on('submit', '#commentForm', App.handleComment);
  },

  handleChatMessage: async function () {
    const chatMessages = $('#chatMessages');
    const chatInput = $('#chatInput');
    const message = chatInput.val().trim();

    if (message) {
      const userMessage = `<div><strong>You:</strong> ${message}</div>`;
      chatMessages.append(userMessage);
      chatInput.val('');
      chatMessages.scrollTop(chatMessages[0].scrollHeight);

      const response = App.generateChatResponse(message);
      const responseMessage = `<div><strong>Bot:</strong> ${response}</div>`;
      chatMessages.append(responseMessage);
      chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }
  },

  generateChatResponse: function (message) {
    const lowerMessage = message.toLowerCase();
    let response = "I'm here to help! Feel free to ask more about our pets or the adoption process.";

    const matchedPets = App.petsData.filter(
      pet =>
        lowerMessage.includes(pet.name.toLowerCase()) ||
        lowerMessage.includes(pet.breed.toLowerCase()) ||
        lowerMessage.includes(pet.location.toLowerCase())
    );

    if (matchedPets.length > 0) {
      response = `Thank you for your interest! Here are the pets matching your request:\n`;
      matchedPets.forEach((pet, index) => {
        const likes = App.likes[pet.id] || 0;
        response += `#${index + 1} - ${pet.name}: ${pet.age}-year-old ${pet.breed}, currently in ${pet.location}. ${likes} people liked them.\n`;
      });
      response += "Would you like more information on any of them, or are you ready to bring one home?";
    } else if (lowerMessage.includes("breed")) {
      response = "We have various breeds here, including Scottish Terriers, French Bulldogs, Boxers, and Golden Retrievers. Feel free to ask me about any of them!";
    } else if (lowerMessage.includes("adopt")) {
      response = "Adopting is simple! Just click the 'Adopt' button next to the pet you're interested in.";
    } else if (lowerMessage.includes("age") || lowerMessage.includes("young")) {
      response = "Most of our pets are between 2 and 4 years old. If you're looking for a specific age range, let me know!";
    }

    return response;
  },

  handleComment: async function (e) {
    e.preventDefault();
    const userName = $('#userName').val().trim();
    const userComment = $('#userComment').val().trim();
    const commentsContainer = $('#commentsContainer');
  
    if (userName && userComment) {
      try {
        // const donationHandled = await App.handleDonation(e);
        App.handleDonation(e);

        const donationHandled = true;

        console.log("Result of handleDonation:", donationHandled);
        if (donationHandled) {
          const newComment = `${userName}: ${userComment}`;
          const index = commentsContainer.children().length;
          App.addComment(newComment, index, commentsContainer);
          console.log("Comment added successfully.");
        } else {
          console.error("Donation failed, comment not added.");
        }
      } catch (error) {
        console.error("Error during donation or comment submission:", error.message);
      }
      $('#commentForm')[0].reset();
    }
  },

  addComment: function (commentText, index, commentsContainer) {
    const commentDiv = $('<div></div>').addClass('comment-item');
    commentDiv.text(commentText);

    // Assign rolling animation class
    if (index % 2 === 0) {
      commentDiv.addClass('even-comment');
    } else {
      commentDiv.addClass('odd-comment');
    }

    commentsContainer.append(commentDiv);
  },

  markAdopted: function () {
    var adoptionInstance;

    App.contracts.Adoption.deployed()
      .then(function (instance) {
        adoptionInstance = instance;
        return adoptionInstance.getAdopters.call();
      })
      .then(function (adopters) {
        for (i = 0; i < adopters.length; i++) {
          if (adopters[i] !== "0x0000000000000000000000000000000000000000") {
            $(".panel-pet")
              .eq(i)
              .find(".btn-adopt")
              .text("Success")
              .attr("disabled", true);

            $(".panel-pet")
              .eq(i)
              .find(".btn-return")
              .css("display", "inline-block");
          } else {
            $(".panel-pet")
              .eq(i)
              .find(".btn-adopt")
              .text("Adopt")
              .attr("disabled", false);

            $(".panel-pet").eq(i).find(".btn-return").css("display", "none");
          }
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },


  handleAdopt: function (event) {
    event.preventDefault();
    const petId = parseInt($(event.target).data('id'));
    console.log("petId: ", petId);
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

  handleReturn: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));
    console.log("petId: ", petId);
    var adoptionInstance;
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;
          return adoptionInstance.returnPet(petId, { from: account });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },

  handleDonation: function (event) {
    event.preventDefault();

    try {
      const amount = web3.toWei(0.1, "ether"); // Change the amount to your desired value
      var sendMeEtherInstance;

      web3.eth.getAccounts(function (error, accounts) {
        if (error) {
          console.log(error);
          return false;
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
          console.log("Donation successful:", result);
          return true;
        }).catch(function (err) {
          console.log(err.message);
          return false;
        });
      });
    } catch (error){
      console.error("Error in handleDonation:", error.message);
      return false; // Return false on failure
    }
  },

  handleAskChatMessage: async function () {
    console.log("-----------------------");
    const chatMessages = $('#askChatMessages');
    console.log("question: ", chatMessages);
    const chatInput = $('#askChatInput');
    const message = chatInput.val().trim();
    console.log("question: ", message);

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
