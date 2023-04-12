$(document).ready(function(){ 
    $('.card-numNights').on('change', function(){
      const numNights = $(this).val();
      const rentalID = $(this).closest('.rental-card').data('id');

      $.post('/update-cart', {id: rentalID, numNights: numNights}, function(res){
        
        $(`.rental-card[data-id="${rentalID}"] .card-numNights`).text(res.cart.numNights);
        $(`.rental-card[data-id="${rentalID}"] .card-total`).text(`C$ ${res.cart.priceStay} total`);

        $('#cartTotal').text(`Subtotal: C$ ${res.cartTotal}`);
        $('#vatAmt').text(`VAT: C$ ${res.vatAmt}`);
        $('#totalPrice').text(`Total Price: C$ ${res.grandTotal}`);
      
      })
    });

    $('.rentBtn').click(function () { 
        const rentalId = $(this).data('id');
        
        $.post('/add-rental', {id: rentalId}, function(){
            //Redirect to cart
            window.location.href = "/cart";
        });
    });

    $('.removeBtn').click(function () { 
        const rentalId = $(this).closest('.rental-card').data('id');

        $.post('/remove-rental', {id: rentalId}, function(){
            //Redirect to cart
            window.location.href = "/cart";
        });
    });

  });