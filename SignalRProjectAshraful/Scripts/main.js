$(function () {
    var hub = $.connection.hub,
        chat = $.connection.chat,
        server = chat.server,
        client = chat.client,
        loginName,
        imagesJson = 0;



    client.rooms = function (rs) {
        $.each(rs, function (i, r) {
            $('#allowedChatRoomsDiv')
                .append($('<btn></btn>')
                    .addClass('btn btn-primary btn-block')
                    .html(r)
                    .click(function () {
                        server.joinRoom($(this).text(), loginName);
                    })
                );
        });
    };

    client.join = function (r) {
        var $message = $('<input type="text" class="form-control" placeholder="Example: Sky Room" aria-label="Username" aria-describedby="msglbl" />');
        var $div = $('<div/>')
            .addClass('card')
            .append($('<div/>')
                .addClass('card-header')
                .append($('<h4/>')
                    .addClass('h4 card-title')
                    .html(r)
                )
            )
            .append($('<div/>')
                .addClass('card-body pre-scrollable')
                .css('height', '200px')
                .append($('<div/>')
                    .addClass('list-group')
                    .attr('data-room', r)
                )
            )
            .append($('<div/>')
                .addClass('card-footer')
                .append($('<div/>')
                    .addClass('input-group mb-xl-1 col-md-12')
                    .append($('<div/>')
                        .addClass('input-group-prepend')
                        .append($('<span/>')
                            .addClass('input-group-text')
                            .html('Message:')
                        )
                    )
                    .append($message)
                    .append($('<div/>')
                        .addClass('input-group-append')
                        .append($('<div/>')
                            .css('height', '0px')
                            .css('width', '0px')
                            .css('overflow', 'hidden')
                            .append($('<image id="filePreviewImage" src="data:image/png;" data-filename=""></image>')
                            )
                            .append($('<input/>')
                                .attr('type', 'file')
                                .attr('id', 'fileInput')
                                .change(function (e) {
                                    if (this.files && this.files[0]) {
                                        var fileName = this.files[0].name;
                                        var reader = new FileReader();
                                        reader.onload = function (e) {
                                            document.getElementById('filePreviewImage').src = e.target.result;
                                            document.getElementById('filePreviewImage').dataset.filename = fileName;
                                        }
                                        reader.readAsDataURL(this.files[0]);
                                    }
                                    imagesJson = 1;
                                    //$imagesJson = $('#filePreviewImage').map(function () {
                                    //    var $this = $(this);
                                    //    return {
                                    //        image: $this.attr('src'),
                                    //        filename: $this.attr('data-filename')
                                    //    };
                                    //}).toArray();
                                })
                            )
                        )
                        .append($('<button/>')
                            .attr('id', 'btnUpload')
                            .attr('type', 'button')
                            .click(function () {
                                $("#fileInput").click();
                            })
                            .addClass('btn btn-light border-top border-bottom border-left-0 border-right-0 fa fa-paperclip')
                        )
                        .append($('<input/>')
                            .attr('type', 'submit')
                            .attr('id', 'sendMessage')
                            .attr('class', 'btn btn-primary')
                            .val('Send')
                            .click(function () {
                                if (imagesJson == 1) {
                                    imagesJson = 0;
                                    server.getByteArray(r, $('#filePreviewImage').prop('src'), loginName);
                                }
                                else {
                                    server.send(r, $message.val(), loginName);
                                }
                            })
                        )
                    )
                )
            );

        $('#chatBoard').append($div);
    };

    client.message = function (room, message) {
        $('[data-room="' + room + '"]')
            .prepend($('<div/>')
                .addClass('list-group-item')
                .append($('<span/>').addClass('col-md-3')
                    .html(message.sender))
                .append($('<span/>').addClass('col-md-9')
                    .html(' : ' + message.message)
                )
            );
    };

    client.image = function (room, image) {
        $('[data-room="' + room + '"]')
            .prepend($('<div/>')
                .addClass('list-group-item')
                .append($('<span/>').addClass('col-md-3')
                    .html(image.sender))
                .append($('<img/>').addClass('figure-img')
                    .attr('src', image.type + ',' + image.buffer)
                    //.html(' : ' + image.buffer)
                )
            );
    };

    client.user = function (user) {
        $('#userImage').attr('src', user.image);
        $('#email').val(user.email);
    };

    var act = false;
    var allow = false;

    $('#active').on('click', function () {
        if ($('#active').is(':checked')) {
            act = true;
        } else {
            act = false;
        }
    });

    $('#allowed').on('click', function () {
        if ($('#allowed').is(':checked')) {
            allow = true;
        } else {
            allow = false;
        }
    });

    $('#validatedCustomFile').on('change', function (e) {
        if (this.files && this.files[0]) {
            var fileName = this.files[0].name;
            var reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('userImage').style.backgroundImage = "url('" + e.target.result + "')";
                //document.getElementById('userImage').src = e.target.result;
                document.getElementById('lblValidatedCustomFile').innerText = fileName;
            }
            reader.readAsDataURL(this.files[0]);
        }
    });


    hub.start().done(function () {
        $('#register').click(function () {
            server.register($('#name').val(), $('#password').val(), $('#email').val(), $('#userImage').prop('src')).done(function (res) {
                $('#userMessage').html(res + '  has registered successfully.');
            });
        });

        $('#activate').click(function () {
            var user = $('#InactiveUsers').val();

            server.activateUser(user, act).done(function (result) {
                $('#InactiveUsers').empty();
                $.each(result, function (i, aUser) {
                    //console.log(aUser);
                    $('#InactiveUsers').append($('<option></option>').val(aUser["UserName"]).html(aUser["User"]));
                });
            });
        });

        $('#addRole').click(function () {
            var roleName = $('#roleName').val();

            server.addRole(roleName).done(function (res) {
                if (res == "Role already exists.") {
                    $('#message').html(res);
                }
                else {
                    $('#roleName').val('');
                    $('#message').html('');
                    $('#roleCollection').empty();
                    $('#roleCollection').append($('<h5 class="h5 col-md-12 text-center"></h5>').html('Existing Roles'));
                    $.each(res, function (i, aRole) {
                        $('#roleCollection').append($('<div class="col-auto img-thumbnail"></div>').html(aRole["Name"]));
                    });
                }
            });

        });

        $('#assignRole').click(function () {
            var user = $('#ActiveUsers').val();
            var role = $('#ExistingRoles').val();
            var roleId = parseInt(role);

            server.assignRole(user, roleId).done(function (result) {
                $('#ActiveUsers').empty();
                $.each(result, function (i, aUser) {
                    //console.log(aUser);
                    $('#ActiveUsers').append($('<option></option>').val(aUser["UserName"]).html(aUser["User"]));
                });

            });

        });

        $("#ActiveUsers").focus(function () {
            server.getActiveUsers().done(function (result) {
                $('#ActiveUsers').empty();
                $.each(result, function (i, aUser) {
                    //console.log(aUser);
                    $('#ActiveUsers').append($('<option></option>').val(aUser["UserName"]).html(aUser["User"]));
                });
            });
        });

        $("#ExistingRoles").focus(function () {
            server.getExistingRoles().done(function (result) {
                $('#ExistingRoles').empty();
                $.each(result, function (i, aRole) {
                    //console.log(aUser);
                    $('#ExistingRoles').append($('<option></option>').val(aRole["RoleID"]).html(aRole["Name"]));
                });
            });
        });

        $("#ChatRooms").focus(function () {
            server.getChatRooms().done(function (result) {
                $('#ChatRooms').empty();
                $.each(result, function (i, aRoomName) {
                    //console.log(aUser);
                    $('#ChatRooms').append($('<option></option>').val(aRoomName["RoomName"]).html(aRoomName["RoomName"]));
                });
            });
        });

        $("#UserWithRole").focus(function () {
            server.getUserWithRole().done(function (result) {
                $('#UserWithRole').empty();
                $.each(result, function (i, aUserWithRole) {
                    //console.log(aUser);
                    $('#UserWithRole').append($('<option></option>').val(aUserWithRole["UserRoleID"]).html(aUserWithRole["UserName"]));
                });
            });
        });

        $('#addChatRoom').click(function () {
            var roomName = $('#roomName').val();

            server.addChatRoom(roomName).done(function (res) {
                if (res == "Room already exists.") {
                    $('#errRoomMsg').html(res);
                }
                else {
                    $('#roomName').val('');
                    $('#errRoomMsg').html('');
                    $('#roomCollection').empty();
                    $('#roomCollection').append($('<h5 class="h5 col-md-12 text-center"></h5>').html('Existing Chat Rooms'));
                    $.each(res, function (i, aRoom) {
                        var date = new Date(aRoom["RoomCreationDate"]).toDateString();
                        $('#roomCollection').append($('<div class="col-auto img-thumbnail"></div>').html('<span class="text-info font-weight-bold">' + aRoom["RoomName"] + '</span><br /><span>' + date + '</span>'));
                    });
                }
            });

        });

        $('#addUserToARoom').click(function () {
            var roomName = $('#ChatRooms').val();
            var userWithRole = $('#UserWithRole').val();
            var userRoleId = parseInt(userWithRole);

            server.addUserToARoom(roomName, userRoleId, allow).done(function (res) {
                if (res == "User has already added to the room.") {
                    $('#errConRoomMsg').html(res);
                }
                else {
                    $('#roomWiseUsers').html("");
                    $('#roomWiseUsers').empty();
                    var roomName = "";
                    var htmlForRoomWiseUsers = "";
                    $.each(res, function (i, aRoomUser) {
                        if (roomName == "") {
                            roomName = aRoomUser["RoomName"];
                            htmlForRoomWiseUsers = htmlForRoomWiseUsers + '<div class="card col-md-12 mb-2"><div class="card-body"><h5 class="card-title col-md-12 text-center">' + aRoomUser["RoomName"] + '</h5><span class="col-auto img-thumbnail text-info font-weight-bold border-info">' + aRoomUser["UserName"] + '</span>';
                        }
                        else if (roomName != aRoomUser["RoomName"]) {
                            roomName = aRoomUser["RoomName"];
                            htmlForRoomWiseUsers = htmlForRoomWiseUsers + '</div></div><div class="card col-md-12 mb-2"><div class="card-body"><h5 class="card-title col-md-12 text-center">' + aRoomUser["RoomName"] + '</h5><span class="col-auto img-thumbnail text-info font-weight-bold border-info">' + aRoomUser["UserName"] + '</span>';
                        }
                        else {
                            htmlForRoomWiseUsers = htmlForRoomWiseUsers + '<span class="col-auto img-thumbnail text-info font-weight-bold border-info">' + aRoomUser["UserName"] + '</span>'
                        }
                    });
                    htmlForRoomWiseUsers = htmlForRoomWiseUsers + '</div></div>';
                    $('#roomWiseUsers').html(htmlForRoomWiseUsers);
                }
            });

        });

        $('#login').click(function () {
            server.login($('#loginName').val(), $('#loginPassword').val()).done(function (res) {
                if (res == "User and/or Password do not match.") {
                    alert(res);
                } else if (res == "User is inactive.") {
                    alert(res);
                } else {
                    loginName = res;
                    $('#loginNameBox, #loginPasswordBox, #loginSubmitBox, #registrationLinkBox, #logoutSubmitBox').toggle();
                    $('#loginName').val('');
                    $('#loginPassword').val('');

                }
            });
        });

        $('#logout').click(function () {
            server.logout(loginName)
                .done(function () {
                    $('#loginNameBox, #loginPasswordBox, #loginSubmitBox, #registrationLinkBox, #logoutSubmitBox').toggle();
                    $('#chatBoard').empty();
                    $('#allowedChatRoomsDiv').empty();
                    $('#allowedChatRoomsDiv').append($('<p></p>')).append($('<h3></h3>').addClass('h3 text-primary text-center').html('Assigned Rooms'));
                });
        });

        $('#name').on('focusout', function () {
            if ($(this).val() != '') {
                server.getUser($(this).val());
            }
        });


    });
});