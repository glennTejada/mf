$(document).ready(async function () {
    const FORM = 'form';
    const WINNERS = 'winner';
    const UNCLAIMED_PRIZE_WINNERS = 'unclaimed_prize_winners';
    const FORFEITED_PRIZES = 'forfeited_prizes';
    const PRODUCTS = [
        'MasterFoods Tomato Sauce 500ml',
        'MasterFoods Barbecue Sauce 500ml',
        'MasterFoods Aussie Farmers Tomato Sauce 500ml',
        'MasterFoods Reduced Salt & Sugar Tomato Sauce 475ml',
        'MasterFoods Barbecue Sauce Smokey 500ml',
        'MasterFoods Tomato Sauce Hidden Veg 500ml',
        'MasterFoods Barbecue Sauce Reduced Salt & Sugar 475ml',
    ]
    const CLOSED_TEXT_WINNER = 'Congratulations to the below prize winner’s who have won a $50 Prezzee digital voucher for our MasterFoods ‘Squeeze more into Easter’ promotion. <br> Winners must claim their prize by 02/08/2022.';
    const CLOSED_TEXT_UNCLAIMED = 'Please note the below winners have not claimed their prizes, and as per the Terms & Conditions, their prize will be redrawn on 07/08/2022 if still unclaimed.';
    const CLOSED_PROMO = "Unfortunately, this competition has concluded.";

    const BANNER_HOME_DESKTOP = 'banner_home_desktop.png';
    const BANNER_FORM_DESKTOP = 'banner_form_desktop.png';
    const BANNER_LOSER_DESKTOP = 'banner_loser_desktop.png';
    const BANNER_WINNER_DESKTOP = 'banner_winner_desktop.png';
    const BANNER_HOME_MOBILE = 'banner_home_mobile.png';
    const BANNER_FORM_MOBILE = 'banner_home_mobile.png';
    const BANNER_LOSER_MOBILE = 'banner_loser_mobile.png';
    const BANNER_WINNER_MOBILE = 'banner_winner_mobile.png';

    const BANNER = {
        'home': {
            'desktop': BANNER_HOME_DESKTOP,
            'mobile': BANNER_HOME_MOBILE
        }
        ,'form': {
            'desktop': BANNER_FORM_DESKTOP,
            'mobile': BANNER_FORM_MOBILE
        },
        'winner': {
            'desktop': BANNER_WINNER_DESKTOP,
            'mobile': BANNER_WINNER_MOBILE
        },
        'loser': {
            'desktop': BANNER_LOSER_DESKTOP,
            'mobile': BANNER_LOSER_MOBILE
        }
    };


    const ENV_STAGING = 'staging';
    const URL_STAGING = 'http://staging.master-foods-backend.test';
    const ENV_PRODUCTION = 'production';
    const URL_PRODUCTION = 'http://master-foods-backend.test';
    const GO_LIVE_DATE = new Date('2022-03-16');
    const NOW = new Date();

    const APP_ENV = NOW >= GO_LIVE_DATE ? ENV_PRODUCTION : ENV_STAGING;
    const API_URL = NOW >= GO_LIVE_DATE ? URL_PRODUCTION : URL_STAGING;
    console.log(APP_ENV+","+API_URL);
    const token = btoa(await sha256(APP_ENV + ':' + API_URL));
    let show = await showSection();

    // Start Process submit form
    if (show === FORM) {
        let html = "";
        $.each(PRODUCTS, function (index, item) {
            html += `<option value='${item}'>${item}</option>`;
        });
        $("#product").append(html);
    }

    $('#enterForm').on('click', function () {
        $('#home').hide();
        $('#form').show();
        changeBanner(BANNER.form);
    })

    $("#formEntry").submit(function (event) {
        event.preventDefault();

        var formData = new FormData();
        formData.append('first_name', $("input[name=first_name]").val());
        formData.append('last_name', $("input[name=last_name]").val());
        formData.append('email', $("input[name=email]").val());
        formData.append('postcode', $("input[name=postcode]").val());
        formData.append('receipt_number', $("input[name=receipt_number]").val());
        formData.append('phone_number', $("input[name=phone_number]").val());
        formData.append('product', $("#product").children("option:selected").val());
        formData.append('upload', $("input[name=upload]")[0].files[0]);

        $.ajax({
            type: 'POST',
            enctype: 'multipart/form-data',
            url: API_URL + "/api/entry?token=" + token,
            data: formData,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(data)
            {
                $('#form').css('display', 'none');

                if (data.winner) {
                    $('#submit-form-winner').css('display', 'block');
                    changeBanner(BANNER.winner);
                } else {
                    $('#submit-form-loser').css('display', 'block');
                    changeBanner(BANNER.loser);
                }
            },
            error: function(xhr) {
                alert('Error: ' + xhr.responseJSON.error);
            }
        });
    });
    // End process submit form

    // Start process render user winners
    if (show === WINNERS) {
        $.ajax({
            url : API_URL + "/api/winners?token=" + token,
            type : "get",
            dateType:"json",
            success : function (result){
                let html = "";
                $.each(result.data, function (index, item) {
                    html += `<div class='winner col-md-3 col-6'>${item.first_name} ${item.last_name}, ${item.suburb}</div>`;
                });
                $(".winners-list").append(html);
            },
            error: function (error) {
                console.log(error)
            }
        });
    }
    // End process render user winners

    // Start process render user unclaimed prize winners
    if (show === UNCLAIMED_PRIZE_WINNERS) {
        $.ajax({
            url : API_URL + "/api/unclaimed?token=" + token,
            type : "get",
            dateType:"json",
            success : function (result){
                let html = "";
                $.each(result.data, function (index, item) {
                    html += `<div class='unclaimed-prize-winner col-md-3 col-6'>${item.first_name} ${item.last_name}, ${item.suburb}</div>`;
                });
                $(".unclaimed-prize-winners-list").append(html);
            },
            error: function (error) {
                console.log(error)
            }
        });
    }
    // End process render user unclaimed prize winners

    // Start process render number forfeited prizes
    if (show === FORFEITED_PRIZES) {
        $.ajax({
            url : API_URL + "/api/forfeits?token=" + token,
            type : "get",
            dateType:"json",
            success : function (result){
                let html = `<b>${result.forfeits}</b>`;
                $("#forfeits").append(html);
            },
            error: function (error) {
                console.log(error)
            }
        });
    }
    // End process render number forfeited prizes

    $('#upload').bind('change', function () {
        var filename = $("#upload").val();
        if (/^\s*$/.test(filename)) {
            $("#noFile").text("Purchase Receipt*");
            $('#fileName').empty()
                .prepend('<img src="icon_upload.png">')
                .prepend('<span>Choose file</span>');

        }
        else {
            $("#noFile").text(filename.replace("C:\\fakepath\\", ""));
            $('#fileName').empty()
                .prepend('<p>Remove file</p>');
        }
    });

    function sha256(string) {
        const utf8 = new TextEncoder().encode(string);
        return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map((bytes) => bytes.toString(16).padStart(2, '0'))
                .join('');
            return hashHex;
        });
    }

    function showSection() {
        const COMP_OPEN_BEGIN = new Date('2022-03-16');
        const COMP_OPEN_END = new Date('2022-04-26');
        const COMP_CLOSE_BEGIN = new Date('2022-04-27');
        const COMP_CLOSE_END = new Date('2022-05-01');
        const WINNERS_BEGIN = new Date('2022-05-02');
        const WINNERS_END = new Date('2022-05-24');
        const UNCLAIMED_BEGIN = new Date('2022-05-25');
        const UNCLAIMED_END = new Date('2022-08-08');
        const REDRAWN_WINNERS_BEGIN = new Date('2022-08-09');
        const REDRAWN_WINNERS_END = new Date('2022-11-10');
        const FORFEITED_BEGIN = new Date('2022-11-11');
        const FORFEITED_END = new Date('2022-12-09');

        switch (true) {
            case (NOW >= COMP_OPEN_BEGIN && NOW <= COMP_OPEN_END):
                $('#home').show();
                changeBanner(BANNER.home)
                return FORM;
            case (NOW >= WINNERS_BEGIN && NOW <= WINNERS_END):
            case (NOW >= REDRAWN_WINNERS_BEGIN && NOW <= REDRAWN_WINNERS_END):
                $('#closed').show();
                $("#closed-text").append(CLOSED_TEXT_WINNER);
                changeBanner(BANNER.home)
                return WINNERS;
            case (NOW >= UNCLAIMED_BEGIN && NOW <= UNCLAIMED_END):
                $('#closed').show();
                $("#closed-text").append(CLOSED_TEXT_UNCLAIMED);
                changeBanner(BANNER.home)
                return UNCLAIMED_PRIZE_WINNERS;
            case (NOW >= FORFEITED_BEGIN && NOW <= FORFEITED_END):
                $('#closed').show();
                $('#forfeited-prizes').show();
                changeBanner(BANNER.home)
                return FORFEITED_PRIZES;
            case (NOW >= COMP_CLOSE_BEGIN && NOW <= COMP_CLOSE_END):
            default:
                $('#closed').show();
                $('#closed-text').append(CLOSED_PROMO);
                changeBanner(BANNER.home)
                break;
        }
    }

    function changeBanner (bannerType) {
        let urlImage = ($(window).width() <= 500) ? bannerType.mobile : bannerType.desktop
        $('.banner img').remove();
        $('.banner').prepend(`<img src="${urlImage}" />`);
        window.scrollTo(0, 0);
    }
});