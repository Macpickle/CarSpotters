function autocomplete(input, objectOfUsers, user) {
    var usernamesList = [];
    var users = objectOfUsers;

    for (let i = 0; i < users.length; i++) {
        if (users[i].username != user && !usernamesList.includes(users[i].username)) {
            usernamesList.push(users[i].username);
        }
    }

    input.addEventListener('input', function() {
        var inputText = input.value;
        var suggestions = [];
        if (inputText) {
            suggestions = usernamesList.filter(function(username) {
                return username.toLowerCase().startsWith(inputText.toLowerCase());
            });
        }

        var parent = document.getElementById('user');
        parent.innerHTML = '';

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



