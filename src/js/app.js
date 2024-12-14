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
    { id: 1, name: "Frieda", breed: "Scottish Terrier", age: 3, location: "Lisco, Alabama"},
    { id: 2, name: "Gina", breed: "Scottish Terrier", age: 3, location: "Tooleville, West Virginia"},
    { id: 3, name: "Collins", breed: "French Bulldog", age: 2, location: "Freeburn, Idaho"},
    { id: 4, name: "Melissa", breed: "Boxer", age: 2, location: "Camas, Pennsylvania"},
    { id: 5, name: "Jeanine", breed: "French Bulldog", age: 2, location: "Gerber, South Dakota"},
    { id: 6, name: "Elvia", breed: "French Bulldog", age: 3, location: "Innsbrook, Illinois"},
    { id: 7, name: "Latisha", breed: "Golden Retriever", age: 3, location: "Soudan, Louisiana"},
    { id: 8, name: "Coleman", breed: "Golden Retriever", age: 3, location: "Jacksonwald, Palau"},
    { id: 9, name: "Kristina", breed: "Golden Retriever", age: 4, location: "Sultana, Massachusetts"},
    { id: 10, name: "Ethel", breed: "Golden Retriever", age: 2, location: "Broadlands, Oregon"},
    { id: 11, name: "Terry", breed: "Golden Retriever", age: 2, location: "Dawn, Wisconsin"}
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
        petTemplate.find(".btn-history").attr("data-id", data[i].id);
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
    $(document).on("click", ".btn-history", App.handleGetAdoptionHistory);
    $(document).on("click", ".btn-close-history", App.handleHistoryPanelClose);
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

  handleGetAdoptionHistory: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));
    var adoptionInstance;
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;

          // Call getPetAdoptionHistory from the contract
          return adoptionInstance.getPetAdoptionHistory(petId, {
            from: account,
          });
        })
        .then(function (result) {
          //console.log("Adoption History for petId " + petId + ":", result);

          var historyContent = $("#historyContent");
          historyContent.empty(); // Clear previous content

          // Loop through each entry in the history
          for (var i = 0; i < result[0].length; i++) {
            var user = result[0][i];
            // According to the BigNumber repo, S stands for sign, E for exponent and C for coefficient (or significand)
            var timestamp = new Date(result[1][i].c[0] * 1000).toLocaleString();
            var action = result[2][i].c[0] === 0 ? "Adopted" : "Returned";
            // Format the history entry string
            // var entryString = "Action: " + action + ", Timestamp: " + timestamp + "\nUser: " +user;
            var entryString = App.formatAdoptionHistoryEntry(action, timestamp, user);
            historyContent.append(
              $("<p>").html(entryString.replace(/\n/g, "<br>"))
            );
          }

          // Show the modal
          $("#adoptionHistoryModal").show();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },

  formatAdoptionHistoryEntry: function (action, timestamp, user, petName = "a pet") {
    // const actionText = action === 0 ? "Adopted" : "Returned";
    const actionText = action;
    // const date = new Date(timestamp * 1000);
    const date = timestamp;
    const timeAgo = App.getTimeAgo(date);
    const readableDate = date.toLocaleString();

    return `${user} ${actionText.toLowerCase()} ${petName}\n` +
           `Date: ${readableDate} on (${timeAgo})`;
  },

  // Helper Function: Get time ago (e.g., "2 days ago")
  getTimeAgo: function (date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const secondsInMinute = 60;
    const secondsInHour = 60 * secondsInMinute;
    const secondsInDay = 24 * secondsInHour;

    if (diffInSeconds < secondsInMinute) {
        return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < secondsInHour) {
        return `${Math.floor(diffInSeconds / secondsInMinute)} minutes ago`;
    } else if (diffInSeconds < secondsInDay) {
        return `${Math.floor(diffInSeconds / secondsInHour)} hours ago`;
    } else {
        return `${Math.floor(diffInSeconds / secondsInDay)} days ago`;
    }
  },

  handleHistoryPanelClose: function (event) {
    $("#adoptionHistoryModal").hide();
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
          const userName = $('#userName').val().trim();
          const userComment = $('#userComment').val().trim();
          const commentsContainer = $('#commentsContainer');
        
          if (userName && userComment) {
            try {
              const newComment = `${userName}: ${userComment}`;
              const index = commentsContainer.children().length;
              App.addComment(newComment, index, commentsContainer);
              console.log("Comment added successfully.");
            } catch (error) {
              console.error("Error during donation or comment submission:", error.message);
            }
            $('#commentForm')[0].reset();
          }
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
    const apiKey = ''; // Replace with your OpenAI API key
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Define your custom prompt
    const customPrompt = `
You are a helpful assistant for Pete's Pet Shop, a webpage dedicated to encouraging dog adoption.

Your role is to:
1. Answer only questions related to the content of this webpage or topics about dogs and dog adoption.
2. If the user's question is out of line or unrelated, respond with:
   "Is there anything else I can help you with? If you're interested in dog adoption, I can provide you with information about the wonderful dogs available for adoption on our webpage!"
3. If the user's question is related to gory, violent, or negative topics, try to steer them in a positive direction. Respond with warmth and comfort, and encourage them with kindness.
4. If the user shows an interest in dogs, gently direct them to donate to the site or adopt dogs using a kind and encouraging tone.

When answering questions, always:
- Relate your responses to the content of the webpage.
- Provide positive, uplifting, and encouraging information to inspire users to adopt a dog or contribute to the cause.

Here is the content of the webpage:
Pete's Pet Shop is a webpage for the adoption of dogs. There are 16 dogs available for adoption, and their details are as follows:
1. Frieda: Scottish Terrier, 3 years old, Lisco, Alabama
2. Gina: Scottish Terrier, 3 years old, Ooleville, West Virginia
3. Collins: French Bulldog, 2 years old, Freeburn, Idaho
4. Melissa: Boxer, 2 years old, Camas, Pennsylvania
5. Jeanine: French Bulldog, 2 years old, Gerber, South Dakota
6. Elvia: French Bulldog, 3 years old, Innsbrook, Illinois
7. Latisha: Golden Retriever, 3 years old, Soudan, Louisiana
8. Coleman: Golden Retriever, 3 years old, Jacksonwald, Palau
9. Nichole: French Bulldog, 2 years old, Honolulu, Hawaii
10. Fran: Boxer, 3 years old, Matheny, Utah
11. Leonor: Boxer, 2 years old, Tyhee, Indiana
12. Dean: Scottish Terrier, 3 years old, Windsor, Montana
13. Stevenson: French Bulldog, 3 years old, Kingstowne, Nevada
14. Kristina: Golden Retriever, 4 years old, Sultana, Massachusetts
15. Ethel: Golden Retriever, 2 years old, Broadlands, Oregon
16. Terry: Golden Retriever, 2 years old, Dawn, Wisconsin

When answering, incorporate details from this list, and emphasize the joy, companionship, and love that adopting a dog can bring. If the user seems interested in supporting the cause, kindly suggest donating to help the wonderful dogs on this site.
`;


    const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: customPrompt }, // System-level instruction
            { role: 'user', content: message }         // User's input
        ],
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
