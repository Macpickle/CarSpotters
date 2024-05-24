function autocomplete(input, objectOfUsers, user) {
    var usernamesList = [];
    var users = objectOfUsers;

    //gets all usernames from the object
    for (let i = 0; i < users.length; i++) {
        //if the username is not already in the list of usernames
        if (!usernamesList.includes(users[i].username)) {
            usernamesList.push(users[i].username);
        }
    }

    input.addEventListener('input', function() {
        var inputText = input.value;
        var suggestions = [];
        if (inputText) {
            // filter usernames if the userinput is starts with the username
            suggestions = usernamesList.filter(function(username) {
                return username.toLowerCase().startsWith(inputText.toLowerCase());
            });
        }

        var parent = document.getElementById('user');
        parent.innerHTML = '';

        // for each suggestion, create a div element and append it to the parent div to show to user
        for (let i = 0; i < suggestions.length; i++) {
            var suggestion = suggestions[i];
            var user = users.find(function(user) {
                return user.username === suggestion;
            });

            var div = document.createElement('div');
            div.className = "user";
            div.innerHTML = `
                <input type="hidden" name="receiver" value="${suggestion}">
                <div class = "image-container">
                    <img src="${user.photo}" alt="${user.username}">
                </div>  
                <p>${user.username}</p>
            `;

            document.getElementById("receiver").value = suggestion;
            parent.appendChild(div);

            div.addEventListener('click', function() {
                input.value = suggestion;
                parent.innerHTML = '';
                document.getElementById('user').style.display = 'none';
            });
        }
    });
}



