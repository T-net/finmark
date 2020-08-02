class ContactMailer < ApplicationMailer
  def data_mail(contact)
    @contact = contact

    sub_data = { country: @contact.country,
                 year: @contact.year }

    data = { template_id: 'country-data',
             substitution_data: sub_data }

    mail(to: @contact.email,
         sparkpost_data: data)
  end

  def msme_data_mail(contact)
    @contact = contact

    sub_data = { country: @contact.country,
                 year: @contact.year }

    data = { template_id: 'msme-country-data',
             substitution_data: sub_data }

    mail(to: @contact.email,
         sparkpost_data: data)
  end

  def data_batch_download(contact, links)
    @contact = contact
    @links_block = ""

    links.delete_if { |l| l.include?("finmark.org.za") && !l.include?(".zip") }
    links.each do |link|
      @links_block << "<p><a href=\"#{link}\" target='_blank' download='true'>#{link}</a></p>"
    end

    data = {
      template_id: 'country-batch-download',
      substitution_data: {
        country: @contact.country,
        dynamic_html: {
          links_block: @links_block
        },
      }
    }

    mail(to: @contact.email,
         sparkpost_data: data)
  end

  def message_mail(message)
    @contact = message
    sub_data = {
      first_name: message.first_name,
      last_name: message.last_name,
      user_email: message.email,
      title: message.title,
      company: message.company,
      country: message.country,
      message: message.message
    }
    data = { template_id: 'message', substitution_data: sub_data }
    mail(to: ENV.fetch('I2I_MAIL'), cc: ENV.fetch('I2I_MAIL_CC'), sparkpost_data: data)
  end
end
