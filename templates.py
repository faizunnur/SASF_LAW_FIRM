SIGNATURE_VERIFICATION_TEMPLATE = """IN THE COURT OF {court_name}

Case No: {case_number}

{parties_names}

APPLICATION UNDER SECTION 73 OF THE EVIDENCE ACT 1872 FOR SIGNATURE VERIFICATION

Respectfully Sheweth:

1. That the above-mentioned case is pending before this Honorable Court and is fixed for [Next Date] for [Purpose].
2. That the signature(s) on the [Document Name e.g., Cheque/Deed/Agreement] marked as Exhibit/Annexure [Number] are highly disputed and strongly contested by the applicant.
3. That the applicant vehemently denies executing the said document and asserts that the signature has been forged/fabricated to maliciously falsely implicate/defraud the applicant.
4. That for the ends of justice and fair adjudication of this matter, it is imperative that the disputed signature(s) be compared with the admitted signature(s) of the applicant by a handwriting expert from the Criminal Investigation Department (CID) or Police Bureau of Investigation (PBI) forensic laboratory.
5. That the applicant is ready and willing to provide sample/admitted signatures before this Honorable Court as required under Section 73 of the Evidence Act 1872.

PRAYER

Wherefore, it is most humbly prayed that Your Honor would be graciously pleased to:
a) Direct the applicant to provide sample signatures in the presence of the Honorable Court;
b) Send the disputed document along with the sample/admitted signatures to a forensic expert (such as CID/PBI) for handwriting analysis and verification;
c) Pass such other or further order(s) as this Honorable Court deems fit and proper in the interest of justice.

And for this act of kindness, the applicant shall ever pray.

Date: ........................
Signature of the Applicant / Advocate
"""

def generate_GD_application(data):
    """
    Generates a formal GD application based on the Bangladesh Police standard.
    """
    # Normalize data fields (Title Case)
    name = str(data['name']).strip().title()
    father_name = str(data['father_name']).strip().title()
    thana = str(data['thana']).strip().title()
    district = str(data['district']).strip().title()
    address = str(data['address']).strip().title()
    incident_location = str(data['incident_location']).strip().title()
    
    # Compact template with single line breaks in header and signature
    template = (
f"{data['date']}\n"
f"To,\n"
f"Officer in Charge\n"
f"{thana} Thana, {district}\n\n"
f"Subject: File a General Diary.\n\n"
f"Dear Sir,\n\n"
f"With due respect I, {name}, S/O: {father_name}, {address}, "
f"had an incident on {data['incident_date']} around {data['incident_time']} at "
f"{incident_location}. {data['description']}.\n\n"
f"In this circumstance, I would like to file a general diary to inform you regarding "
f"the incident.\n\n"
f"Your kind consideration is highly appreciated.\n\n"
f"Sincerely yours,\n"
f"{name}\n"
f"Address: {address}\n"
f"Mobile: {data['mobile']}"
    )
    return template.strip()
