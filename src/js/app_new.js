App = {
  web3Provider: null,
  contracts: {},
  likes: {}, // Track likes for each pet

  // Project context template
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

    await App.initWeb3();
    return App.initContract();
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

    App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-like', App.handleLike);
    $(document).on('click', '#sendMessageBtn', App.handleChatMessage);
    $(document).on('keypress', '#chatInput', function (event) {
      if (event.which === 13) {
        App.handleChatMessage();
      }
    });
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

    // 匹配所有相关宠物
    const matchedPets = App.petsData.filter(
      pet =>
        lowerMessage.includes(pet.name.toLowerCase()) ||
        lowerMessage.includes(pet.breed.toLowerCase()) ||
        lowerMessage.includes(pet.location.toLowerCase())
    );

    // 构建回答
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

  handleLike: function (event) {
    event.preventDefault();
    const petId = parseInt($(event.target).data('id'));

    if (!App.likes[petId]) {
      App.likes[petId] = 0;
    }
    App.likes[petId]++;
    $(event.target).siblings('.like-count').text(App.likes[petId]);
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
              .text('Adopted!')
              .attr('disabled', true);
          }
        }
      })
      .catch(function (err) {
        console.error('Error in markAdopted:', err.message);
      });
  }
};

$(function () {
  $(window).on('load', function () {
    App.init();
  });
});
