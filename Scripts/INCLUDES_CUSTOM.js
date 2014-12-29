/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
	    available to all master scripts
|
| Notes   : 20/10/2014 - Jason Plaisted
|         : contactObj - override from default to add PassportNumber and StateIDNumber to getEmailTemplateParams
|         : comparePeopleUAE - Called from createRefContactsFromCapContactsAndLink and uses PassportNumber and 
|           StateIDNumber as first match criteria 
/------------------------------------------------------------------------------------------------------*/

//Return Standar Choices Seq Number
function getBizDomainID(stdChoice, stdValue){
	var strControl = 0;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);

   	if (bizDomScriptResult.getSuccess())
   		{
		var bizDomScriptObj = bizDomScriptResult.getOutput();
		strControl = bizDomScriptObj.getDispositionID();
		logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
}

function capHasFeeItem(fcode, fsched){
	feeItemsResult = aa.finance.getFeeItemByCapID(capId);
	    if (feeItemsResult.getSuccess()) {
	        feeItems = feeItemsResult.getOutput();
	        for( x in feeItems)
	        {
	        	//feeItems[x].getFeeDescription()
	        	if (feeItems[x].getFeeCod() == fcode && feeItems[x].getFeeSchudle() == fsched)
	        		return true;
	        }
	    }
	return false;
}

//Schedule Inspection, returns inspection ID
function scheduleInspection(e, t)
{
    var n = null;
    var r = null;
    var i = "Scheduled via Script";
    if(arguments.length >= 3)if(arguments[2] != null)
    {
        var s = aa.person.getUser(arguments[2]);
        if(s.getSuccess())var n = s.getOutput()
    }
    if(arguments.length >= 4)if(arguments[3] != null)r = arguments[3];
    if(arguments.length == 5)if(arguments[4] != null)i = arguments[4];
    var inspectionNum = aa.inspection.scheduleInspection(capId, n, aa.date.parseDate(dateAdd(null, t)), r, e, i);
   
    if(inspectionNum.getSuccess())
    {
        logDebug("Successfully scheduled inspection : " + e + " for " + dateAdd(null, t));
        return inspectionNum.getOutput();
    }
    else
    {
        logDebug("**ERROR: adding scheduling inspection (" + e + "): " + inspectionNum.getErrorMessage())
        return null;
    }
}

function comparePeopleUAE(peop)
	{

	/* 
		this function will be passed as a parameter to the createRefContactsFromCapContactsAndLink function.
		takes a single peopleModel as a parameter, and will return the sequence number of the first G6Contact result
		returns null if there are no matches
	
		Best Practice Template Version uses the following algorithm:
		
		1.  Match on Passport Number/State ID Number if either exist
		2.  else, match on Email Address if it exists
		3.  else, match on First, Middle, Last Name
		4.  else compare on Full Name
		
		This function can use attributes if desired
	*/
	
	if (peop.getPassportNumber() || peop.getStateIDNbr())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
		
		logDebug("we have a SSN " + peop.getPassportNumber() + " or FEIN, checking on that");
		if (peop.getPassportNumber()) qryPeople.setPassportNumber(peop.getPassportNumber());
		if (peop.getStateIDNbr()) qryPeople.setStateIDNbr(peop.getStateIDNbr());
		
		var r = aa.people.getPeopleByPeopleModel(qryPeople);
		
		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();
		
		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}
		
	if (peop.getEmail())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
		
		qryPeople.setServiceProviderCode(aa.getServiceProviderCode());	
	
		logDebug("we have an email, checking on that");
		qryPeople.setEmail(peop.getEmail());

		var r = aa.people.getPeopleByPeopleModel(qryPeople);

		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();

		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}
		
	if (peop.getLastName() && peop.getFirstName())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();		
		qryPeople.setLastName(peop.getLastName());
		qryPeople.setFirstName(peop.getFirstName());
		if (peop.getMiddleName()) qryPeople.setMiddleName(peop.getMiddleName());

		var r = aa.people.getPeopleByPeopleModel(qryPeople);

		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();

		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}
		
	if (peop.getFullName())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();		
		qryPeople.setFullName(peop.getFullName());

		var r = aa.people.getPeopleByPeopleModel(qryPeople);

		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();

		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}
		
	logDebug("Compare People did not find a match");
		return false;
	}
	
function contactObj(ccsm)  {

    this.people = null;         // for access to the underlying data
    this.capContact = null;     // for access to the underlying data
    this.capContactScript = null;   // for access to the underlying data
    this.capId = null;
    this.type = null;
    this.seqNumber = null;
    this.refSeqNumber = null;
    this.asiObj = null;
    this.asi = new Array();    // associative array of attributes
    this.primary = null;
    this.relation = null;
    this.addresses = null;  // array of addresses
    this.validAttrs = false;
        
    this.capContactScript = ccsm;
    if (ccsm)  {
        if (ccsm.getCapContactModel == undefined) {  // page flow
            this.people = this.capContactScript.getPeople();
            this.refSeqNumber = this.capContactScript.getRefContactNumber();
            }
        else {
            this.capContact = ccsm.getCapContactModel();
            this.people = this.capContact.getPeople();
            this.refSeqNumber = this.capContact.getRefContactNumber();
            if (this.people.getAttributes() != null) {
                this.asiObj = this.people.getAttributes().toArray();
                if (this.asiObj != null) {
                    for (var xx1 in this.asiObj) this.asi[this.asiObj[xx1].attributeName] = this.asiObj[xx1];
                    this.validAttrs = true; 
                }   
            }
        }  

        //this.primary = this.capContact.getPrimaryFlag().equals("Y");
        this.relation = this.people.relation;
        this.seqNumber = this.people.contactSeqNumber;
        this.type = this.people.getContactType();
        this.capId = this.capContactScript.getCapID();
        var contactAddressrs = aa.address.getContactAddressListByCapContact(this.capContact);
        if (contactAddressrs.getSuccess()) {
            this.addresses = contactAddressrs.getOutput();
            var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
            this.people.setContactAddressList(contactAddressModelArr);
            }
        else {
            pmcal = this.people.getContactAddressList();
            if (pmcal) {
                this.addresses = pmcal.toArray();
            }
        }
    }       
        this.toString = function() { return this.capId + " : " + this.type + " " + this.people.getLastName() + "," + this.people.getFirstName() + " (id:" + this.seqNumber + "/" + this.refSeqNumber + ") #ofAddr=" + this.addresses.length + " primary=" + this.primary;  }
        
        this.getEmailTemplateParams = function (params) {
            addParameter(params, "$$LastName$$", this.people.getLastName());
            addParameter(params, "$$FirstName$$", this.people.getFirstName());
            addParameter(params, "$$MiddleName$$", this.people.getMiddleName());
            addParameter(params, "$$BusinesName$$", this.people.getBusinessName());
            addParameter(params, "$$ContactSeqNumber$$", this.seqNumber);
            addParameter(params, "$$ContactType$$", this.type);
            addParameter(params, "$$Relation$$", this.relation);
            addParameter(params, "$$Phone1$$", this.people.getPhone1());
            addParameter(params, "$$Phone2$$", this.people.getPhone2());
            addParameter(params, "$$Email$$", this.people.getEmail());
            addParameter(params, "$$AddressLine1$$", this.people.getCompactAddress().getAddressLine1());
            addParameter(params, "$$AddressLine2$$", this.people.getCompactAddress().getAddressLine2());
            addParameter(params, "$$City$$", this.people.getCompactAddress().getCity());
            addParameter(params, "$$State$$", this.people.getCompactAddress().getState());
            addParameter(params, "$$Zip$$", this.people.getCompactAddress().getZip());
            addParameter(params, "$$Fax$$", this.people.getFax());
            addParameter(params, "$$Country$$", this.people.getCompactAddress().getCountry());
            addParameter(params, "$$FullName$$", this.people.getFullName());
			addParameter(params, "$$PassportNumber$$", this.people.getPassportNumber());
			addParameter(params, "$$StateIDNumber$$", this.people.getStateIDNbr());
			
            return params;
            }
        
        this.replace = function(targetCapId) { // send to another record, optional new contact type
        
            var newType = this.type;
            if (arguments.length == 2) newType = arguments[1];
            //2. Get people with target CAPID.
            var targetPeoples = getContactObjs(targetCapId,[String(newType)]);
            //3. Check to see which people is matched in both source and target.
            for (var loopk in targetPeoples)  {
                var targetContact = targetPeoples[loopk];
                if (this.equals(targetPeoples[loopk])) {
                    targetContact.people.setContactType(newType);
                    aa.people.copyCapContactModel(this.capContact, targetContact.capContact);
                    targetContact.people.setContactAddressList(this.people.getContactAddressList());
                    overwriteResult = aa.people.editCapContactWithAttribute(targetContact.capContact);
                    if (overwriteResult.getSuccess())
                        logDebug("overwrite contact " + targetContact + " with " + this);
                    else
                        logDebug("error overwriting contact : " + this + " : " + overwriteResult.getErrorMessage());
                    return true;
                    }
                }

                var tmpCapId = this.capContact.getCapID();
                var tmpType = this.type;
                this.people.setContactType(newType);
                this.capContact.setCapID(targetCapId);
                createResult = aa.people.createCapContactWithAttribute(this.capContact);
                if (createResult.getSuccess())
                    logDebug("(contactObj) contact created : " + this);
                else
                    logDebug("(contactObj) error creating contact : " + this + " : " + createResult.getErrorMessage());
                this.capContact.setCapID(tmpCapId);
                this.type = tmpType;
                return true;
        }

        this.equals = function(t) {
            if (t == null) return false;
            if (!String(this.people.type).equals(String(t.people.type))) { return false; }
            if (!String(this.people.getFirstName()).equals(String(t.people.getFirstName()))) { return false; }
            if (!String(this.people.getLastName()).equals(String(t.people.getLastName()))) { return false; }
            if (!String(this.people.getFullName()).equals(String(t.people.getFullName()))) { return false; }
            if (!String(this.people.getBusinessName()).equals(String(t.people.getBusinessName()))) { return false; }
            return  true;
        }
        
        this.saveBase = function() {
            // set the values we store outside of the models.
            this.people.setContactType(this.type);
            this.capContact.setPrimaryFlag(this.primary ? "Y" : "N");
            this.people.setRelation(this.relation);
            saveResult = aa.people.editCapContact(this.capContact);
            if (saveResult.getSuccess())
                logDebug("(contactObj) base contact saved : " + this);
            else
                logDebug("(contactObj) error saving base contact : " + this + " : " + saveResult.getErrorMessage());
            }               
        
        this.save = function() {
            // set the values we store outside of the models
            this.people.setContactType(this.type);
            this.capContact.setPrimaryFlag(this.primary ? "Y" : "N");
            this.people.setRelation(this.relation);
            this.capContact.setPeople(this.people);
            saveResult = aa.people.editCapContactWithAttribute(this.capContact);
            if (saveResult.getSuccess())
                logDebug("(contactObj) contact saved : " + this);
            else
                logDebug("(contactObj) error saving contact : " + this + " : " + saveResult.getErrorMessage());
            }

        //get method for Attributes
        this.getAttribute = function (vAttributeName){
            var retVal = null;
            if(this.validAttrs){
                var tmpVal = this.asi[vAttributeName.toString().toUpperCase()];
                if(tmpVal != null)
                    retVal = tmpVal.getAttributeValue();
            }
            return retVal;
        }
        
        //Set method for Attributes
        this.setAttribute = function(vAttributeName,vAttributeValue){
            var retVal = false;
            if(this.validAttrs){
                var tmpVal = this.asi[vAttributeName.toString().toUpperCase()];
                if(tmpVal != null){
                    tmpVal.setAttributeValue(vAttributeValue);
                    retVal = true;
                }
            }
            return retVal;
        }

        this.remove = function() {
            var removeResult = aa.people.removeCapContact(this.capId, this.seqNumber)
            if (removeResult.getSuccess())
                logDebug("(contactObj) contact removed : " + this + " from record " + this.capId.getCustomID());
            else
                logDebug("(contactObj) error removing contact : " + this + " : from record " + this.capId.getCustomID() + " : " + removeResult.getErrorMessage());
            }

        this.isSingleAddressPerType = function() {
            if (this.addresses.length > 1) 
                {
                
                var addrTypeCount = new Array();
                for (y in this.addresses) 
                    {
                    thisAddr = this.addresses[y];
                    addrTypeCount[thisAddr.addressType] = 0;
                    }

                for (yy in this.addresses) 
                    {
                    thisAddr = this.addresses[yy];
                    addrTypeCount[thisAddr.addressType] += 1;
                    }

                for (z in addrTypeCount) 
                    {
                    if (addrTypeCount[z] > 1) 
                        return false;
                    }
                }
            else
                {
                return true;    
                }

            return true;

            }

        this.getAddressTypeCounts = function() { //returns an associative array of how many adddresses are attached.
           
            var addrTypeCount = new Array();
            
            for (y in this.addresses) 
                {
                thisAddr = this.addresses[y];
                addrTypeCount[thisAddr.addressType] = 0;
                }

            for (yy in this.addresses) 
                {
                thisAddr = this.addresses[yy];
                addrTypeCount[thisAddr.addressType] += 1;
                }

            return addrTypeCount;

            }

        this.createPublicUser = function() {

            if (!this.capContact.getEmail())
            { logDebug("(contactObj) Couldn't create public user for : " + this +  ", no email address"); return false; }

            if (String(this.people.getContactTypeFlag()).equals("organization"))
            { logDebug("(contactObj) Couldn't create public user for " + this + ", the contact is an organization"); return false; }
            
            // check to see if public user exists already based on email address
            var getUserResult = aa.publicUser.getPublicUserByEmail(this.capContact.getEmail())
            if (getUserResult.getSuccess() && getUserResult.getOutput()) {
                userModel = getUserResult.getOutput();
                logDebug("(contactObj) createPublicUserFromContact: Found an existing public user: " + userModel.getUserID());
            }

            if (!userModel) // create one
                {
                logDebug("(contactObj) CreatePublicUserFromContact: creating new user based on email address: " + this.capContact.getEmail()); 
                var publicUser = aa.publicUser.getPublicUserModel();
                publicUser.setFirstName(this.capContact.getFirstName());
                publicUser.setLastName(this.capContact.getLastName());
                publicUser.setEmail(this.capContact.getEmail());
                publicUser.setUserID(this.capContact.getEmail());
                publicUser.setPassword("e8248cbe79a288ffec75d7300ad2e07172f487f6"); //password : 1111111111
                publicUser.setAuditID("PublicUser");
                publicUser.setAuditStatus("A");
                publicUser.setCellPhone(this.people.getPhone2());

                var result = aa.publicUser.createPublicUser(publicUser);
                if (result.getSuccess()) {

                logDebug("(contactObj) Created public user " + this.capContact.getEmail() + "  sucessfully.");
                var userSeqNum = result.getOutput();
                var userModel = aa.publicUser.getPublicUser(userSeqNum).getOutput()

                // create for agency
                aa.publicUser.createPublicUserForAgency(userModel);

                // activate for agency
                var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
                userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(aa.getServiceProviderCode(),userSeqNum,"ADMIN");

                // reset password
                var resetPasswordResult = aa.publicUser.resetPassword(this.capContact.getEmail());
                if (resetPasswordResult.getSuccess()) {
                    var resetPassword = resetPasswordResult.getOutput();
                    userModel.setPassword(resetPassword);
                    logDebug("(contactObj) Reset password for " + this.capContact.getEmail() + "  sucessfully.");
                } else {
                    logDebug("(contactObj **WARNING: Reset password for  " + this.capContact.getEmail() + "  failure:" + resetPasswordResult.getErrorMessage());
                }

                // send Activate email
                aa.publicUser.sendActivateEmail(userModel, true, true);

                // send another email
                aa.publicUser.sendPasswordEmail(userModel);
                }
                else {
                    logDebug("(contactObj) **WARNIJNG creating public user " + this.capContact.getEmail() + "  failure: " + result.getErrorMessage()); return null;
                }
            }

        //  Now that we have a public user let's connect to the reference contact       
            
        if (this.refSeqNumber)
            {
            logDebug("(contactObj) CreatePublicUserFromContact: Linking this public user with reference contact : " + this.refSeqNumber);
            aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), this.refSeqNumber);
            }
            

        return userModel; // send back the new or existing public user
        }

        this.getCaps = function() { // option record type filter

        
            if (this.refSeqNumber) {
                aa.print("ref seq : " + this.refSeqNumber);
                var capTypes = null;
                var resultArray = new Array();
                if (arguments.length == 1) capTypes = arguments[0];

                var pm = aa.people.createPeopleModel().getOutput().getPeopleModel(); 
                var ccb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput(); 
                pm.setServiceProviderCode(aa.getServiceProviderCode()) ; 
                pm.setContactSeqNumber(this.refSeqNumber); 

                var cList = ccb.getCapContactsByRefContactModel(pm).toArray();
                
                for (var j in cList) {
                    var thisCapId = aa.cap.getCapID(cList[j].getCapID().getID1(),cList[j].getCapID().getID2(),cList[j].getCapID().getID3()).getOutput();
                    if (capTypes && appMatch(capTypes,thisCapId)) {
                        resultArray.push(thisCapId)
                        }
                    }
            }
            
        return resultArray;
        }

        this.getRelatedContactObjs = function() { // option record type filter
        
            if (this.refSeqNumber) {
                var capTypes = null;
                var resultArray = new Array();
                if (arguments.length == 1) capTypes = arguments[0];

                var pm = aa.people.createPeopleModel().getOutput().getPeopleModel(); 
                var ccb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput(); 
                pm.setServiceProviderCode(aa.getServiceProviderCode()) ; 
                pm.setContactSeqNumber(this.refSeqNumber); 

                var cList = ccb.getCapContactsByRefContactModel(pm).toArray();
                
                for (var j in cList) {
                    var thisCapId = aa.cap.getCapID(cList[j].getCapID().getID1(),cList[j].getCapID().getID2(),cList[j].getCapID().getID3()).getOutput();
                    if (capTypes && appMatch(capTypes,thisCapId)) {
                        var ccsm = aa.people.getCapContactByPK(thisCapId, cList[j].getPeople().contactSeqNumber).getOutput();
                        var newContactObj = new contactObj(ccsm);
                        resultArray.push(newContactObj)
                        }
                    }
            }
            
        return resultArray;
        }
        
        
        
        this.createRefLicProf = function(licNum,rlpType,addressType,licenseState) {
            
            // optional 3rd parameter serv_prov_code
            var updating = false;
            var serv_prov_code_4_lp = aa.getServiceProviderCode();
            if (arguments.length == 5) {
                serv_prov_code_4_lp = arguments[4];
                aa.setDelegateAgencyCode(serv_prov_code_4_lp);
                }
            
            // addressType = one of the contact address types, or null to pull from the standard contact fields.
            var newLic = getRefLicenseProf(licNum);

            if (newLic) {
                updating = true;
                logDebug("(contactObj) Updating existing Ref Lic Prof : " + licNum);
                }
            else {
                var newLic = aa.licenseScript.createLicenseScriptModel();
                }

            peop = this.people;
            cont = this.capContact;
            if (cont.getFirstName() != null) newLic.setContactFirstName(cont.getFirstName());
            if (peop.getMiddleName() != null) newLic.setContactMiddleName(peop.getMiddleName()); // use people for this
            if (cont.getLastName() != null) if (peop.getNamesuffix() != null) newLic.setContactLastName(cont.getLastName() + " " + peop.getNamesuffix()); else newLic.setContactLastName(cont.getLastName());
            if (peop.getBusinessName() != null) newLic.setBusinessName(peop.getBusinessName());
            if (peop.getPhone1() != null) newLic.setPhone1(peop.getPhone1());
            if (peop.getPhone2() != null) newLic.setPhone2(peop.getPhone2());
            if (peop.getEmail() != null) newLic.setEMailAddress(peop.getEmail());
            if (peop.getFax() != null) newLic.setFax(peop.getFax());
            newLic.setAgencyCode(serv_prov_code_4_lp);
            newLic.setAuditDate(sysDate);
            newLic.setAuditID(currentUserID);
            newLic.setAuditStatus("A");
            newLic.setLicenseType(rlpType);
            newLic.setStateLicense(licNum);
            newLic.setLicState(licenseState);
            //setting this field for a future enhancement to filter license types by the licensing board field. (this will be populated with agency names)
            var agencyLong = lookup("CONTACT_ACROSS_AGENCIES",servProvCode);
            if (!matches(agencyLong,undefined,null,"")) newLic.setLicenseBoard(agencyLong); else newLic.setLicenseBoard("");
 
            var addr = null;

            if (addressType) {
                for (var i in this.addresses) {
                    cAddr = this.addresses[i];
                    if (addressType.equals(cAddr.getAddressType())) {
                        addr = cAddr;
                    }
                }
            }
            
            if (!addr) addr = peop.getCompactAddress();   //  only used on non-multiple addresses or if we can't find the right multi-address
            
            if (addr.getAddressLine1() != null) newLic.setAddress1(addr.getAddressLine1());
            if (addr.getAddressLine2() != null) newLic.setAddress2(addr.getAddressLine2());
            if (addr.getAddressLine3() != null) newLic.getLicenseModel().setTitle(addr.getAddressLine3());
            if (addr.getCity() != null) newLic.setCity(addr.getCity());
            if (addr.getState() != null) newLic.setState(addr.getState());
            if (addr.getZip() != null) newLic.setZip(addr.getZip());
            if (addr.getCountryCode() != null) newLic.getLicenseModel().setCountryCode(addr.getCountryCode());
            
            if (updating)
                myResult = aa.licenseScript.editRefLicenseProf(newLic);
            else
                myResult = aa.licenseScript.createRefLicenseProf(newLic);

            if (arguments.length == 5) {
                aa.resetDelegateAgencyCode();
            }
                
            if (myResult.getSuccess())
                {
                logDebug("Successfully added/updated License No. " + licNum + ", Type: " + rlpType + " From Contact " + this);
                return true;
                }
            else
                {
                logDebug("**WARNING: can't create ref lic prof: " + myResult.getErrorMessage());
                return false;
                }
        }
        
        this.getAKA = function() {
            var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
            if (this.refSeqNumber) {
                return aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(),String(this.refSeqNumber)).toArray();
                }
            else {
                logDebug("contactObj: Cannot get AKA names for a non-reference contact");
                return false;
                }
            }
            
        this.addAKA = function(firstName,middleName,lastName,fullName,startDate,endDate) {
            if (!this.refSeqNumber) {
                logDebug("contactObj: Cannot add AKA name for non-reference contact");
                return false;
                }
                
            var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
            var args = new Array();
            var akaModel = aa.proxyInvoker.newInstance("com.accela.orm.model.contact.PeopleAKAModel",args).getOutput();
            var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel",args).getOutput();

            var a = aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(),String(this.refSeqNumber));
            akaModel.setServiceProviderCode(aa.getServiceProviderCode());
            akaModel.setContactNumber(parseInt(this.refSeqNumber));
            akaModel.setFirstName(firstName);
            akaModel.setMiddleName(middleName);
            akaModel.setLastName(lastName);
            akaModel.setFullName(fullName);
            akaModel.setStartDate(startDate);
            akaModel.setEndDate(endDate);
            auditModel.setAuditDate(new Date());
            auditModel.setAuditStatus("A");
            auditModel.setAuditID("ADMIN");
            akaModel.setAuditModel(auditModel);
            a.add(akaModel);

            aka.saveModels(aa.getServiceProviderCode(), this.refSeqNumber, a);
            }

        this.removeAKA = function(firstName,middleName,lastName) {
            if (!this.refSeqNumber) {
                logDebug("contactObj: Cannot remove AKA name for non-reference contact");
                return false;
                }
            
            var removed = false;
            var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
            var l = aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(),String(this.refSeqNumber));
            
            var i = l.iterator();
            while (i.hasNext()) {
                var thisAKA = i.next();
                if ((!thisAKA.getFirstName() || thisAKA.getFirstName().equals(firstName)) && (!thisAKA.getMiddleName() || thisAKA.getMiddleName().equals(middleName)) && (!thisAKA.getLastName() || thisAKA.getLastName().equals(lastName))) {
                    i.remove();
                    logDebug("contactObj: removed AKA Name : " + firstName + " " + middleName + " " + lastName);
                    removed = true;
                    }
                }   
                    
            if (removed)
                aka.saveModels(aa.getServiceProviderCode(), this.refSeqNumber, l);
            }

        this.hasPublicUser = function() { 
            if (this.refSeqNumber == null) return false;
            var s_publicUserResult = aa.publicUser.getPublicUserListByContactNBR(aa.util.parseLong(this.refSeqNumber));
            
            if (s_publicUserResult.getSuccess()) {
                var fpublicUsers = s_publicUserResult.getOutput();
                if (fpublicUsers == null || fpublicUsers.size() == 0) {
                    logDebug("The contact("+this.refSeqNumber+") is not associated with any public user.");
                    return false;
                } else {
                    logDebug("The contact("+this.refSeqNumber+") is associated with "+fpublicUsers.size()+" public users.");
                    return true;
                }
            } else { logMessage("**ERROR: Failed to get public user by contact number: " + s_publicUserResult.getErrorMessage()); return false; }
        }

        this.linkToPublicUser = function(pUserId) { 
           
            if (pUserId != null) {
                var pSeqNumber = pUserId.replace('PUBLICUSER','');
                
                var s_publicUserResult = aa.publicUser.getPublicUser(aa.util.parseLong(pSeqNumber));

                if (s_publicUserResult.getSuccess()) {
                    var linkResult = aa.licenseScript.associateContactWithPublicUser(pSeqNumber, this.refSeqNumber);

                    if (linkResult.getSuccess()) {
                        logDebug("Successfully linked public user " + pSeqNumber + " to contact " + this.refSeqNumber);
                    } else {
                        logDebug("Failed to link contact to public user");
                        return false;
                    }
                } else {
                    logDebug("Could not find a public user with the seq number: " + pSeqNumber);
                    return false;
                }


            } else {
                logDebug("No public user id provided");
                return false;
            }
        }

        this.sendCreateAndLinkNotification = function() {
            //for the scenario in AA where a paper application has been submitted
            var toEmail = this.people.getEmail();

            if (toEmail) {
                var params = aa.util.newHashtable();
                getACARecordParam4Notification(params,acaUrl);
                addParameter(params, "$$licenseType$$", cap.getCapType().getAlias());
                addParameter(params,"$$altID$$",capIDString);
                var notificationName;

                if (this.people.getContactTypeFlag() == "individual") {
                    notificationName = this.people.getFirstName() + " " + this.people.getLastName();
                } else {
                    notificationName = this.people.getBusinessName();
                }

                if (notificationName)
                    addParameter(params,"$$notificationName$$",notificationName);
                if (this.refSeqNumber) {
                    var v = new verhoeff();
                    var pinCode = v.compute(String(this.refSeqNumber));
                    addParameter(params,"$$pinCode$$",pinCode);

                    sendNotification(sysFromEmail,toEmail,"","PUBLICUSER CREATE AND LINK",params,null);                    
                }

                               
            }

        }

        this.getRelatedRefContacts = function() { //Optional relationship types array 
            
            var relTypes;
            if (arguments.length > 0) relTypes = arguments[0];
            
            var relConsArray = new Array();

            if (matches(this.refSeqNumber,null,undefined,"")) return relConsArray;

            //check as the source
            var xrb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
            xRefContactEntityModel = aa.people.getXRefContactEntityModel().getOutput();
            xRefContactEntityModel.setContactSeqNumber(parseInt(this.refSeqNumber));
            x = xrb.getXRefContactEntityList(xRefContactEntityModel);


            if (x.size() > 0) {
                var relConList = x.toArray();

                for (var zz in relConList) {
                    var thisRelCon = relConList[zz];
                    var addThisCon = true;
                    if (relTypes) {
                        addThisCon = exists(thisRelCon.getEntityID4(),relTypes);
                    }

                    if (addThisCon) {
                        var peopResult = aa.people.getPeople(thisRelCon.getEntityID1());
                        if (peopResult.getSuccess()) {
                            var peop = peopResult.getOutput();
                            relConsArray.push(peop);
                        }
                    }

                }
            }

            //check as the target
            var xrb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
            xRefContactEntityModel = aa.people.getXRefContactEntityModel().getOutput();
            xRefContactEntityModel.setEntityID1(parseInt(this.refSeqNumber));
            x = xrb.getXRefContactEntityList(xRefContactEntityModel);

            if (x.size() > 0) {
                var relConList = x.toArray();

                for (var zz in relConList) {
                    var thisRelCon = relConList[zz];
                    var addThisCon = true;
                    if (relTypes) {
                        addThisCon = exists(thisRelCon.getEntityID4(),relTypes);
                    }

                    if (addThisCon) {
                        var peopResult = aa.people.getPeople(thisRelCon.getContactSeqNumber());
                        if (peopResult.getSuccess()) {
                            var peop = peopResult.getOutput();
                            relConsArray.push(peop);
                        }
                    }

                }
            }           

            return relConsArray;
        }
    }
function addASITable4ACAPageFlow(destinationTableGroupModel,tableName,tableValueArray) // optional capId
{
  //  tableName is the name of the ASI table
  //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
  //
    var itemCap = capId
    if (arguments.length > 3)
    itemCap = arguments[3]; // use cap ID specified in args
    var ta = destinationTableGroupModel.getTablesMap().values();
    var tai = ta.iterator();
    var found = false;

    while (tai.hasNext())
    {
		var tsm = tai.next();  // com.accela.aa.aamain.appspectable.AppSpecificTableModel
		if (tsm.getTableName().equals(tableName)) { found = true; break; }
    }

    if (!found) { logDebug("cannot update asit for ACA, no matching table name"); return false; }

    var fld = aa.util.newArrayList();  // had to do this since it was coming up null.
    var fld_readonly = aa.util.newArrayList(); // had to do this since it was coming up null.
    var i = -1; // row index counter
    for (thisrow in tableValueArray)
    {
		var col = tsm.getColumns()
		var coli = col.iterator();
		while (coli.hasNext())
		{
			var colname = coli.next();
			if (typeof(tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
			{
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue,colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField",args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g,"\+"));
				fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
				fld.add(fldToAdd);
				fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
			}
			else // we are passed a string
			{
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()],colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField",args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g,"\+"));
				fldToAdd.setReadOnly(false);
				fld.add(fldToAdd);
				fld_readonly.add("N");
			}
		}
		i--;
		tsm.setTableFields(fld);
		tsm.setReadonlyField(fld_readonly); // set readonly field
	}
    tssm = tsm;
    return destinationTableGroupModel;
}      

function addMakani(makaniID) {
mapService = "DM_GIS";
makLayer = "Entrances";

aa.gis.addCapGISObject(capId, mapService, makLayer, makaniID, true);

//parcelID = getGISInfo(mapService, layer, "COMM_PARCE");
//latCoord = getGISInfo(mapService, layer, "LATITUDE");
//longCoord = getGISInfo(mapService, layer, "LONGITUDE");
//districtCode = getGISInfo(mapService, layer, "CNAME_E");

//parcelLayer = "Parcels";
//aa.gis.addCapGISObject(capId, mapService, parcelLayer, parcelID, false);
}



function copyASIFieldsAndData(srcCapId, targetCapId) // optional groups to ignore
{
	var ignoreArray = new Array();
	for (var i = 2; i < arguments.length; i++)
		ignoreArray.push(arguments[i])

	var appSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(srcCapId);
	if (s_result.getSuccess()) {
		var appSpecificInfo = s_result.getOutput();
		if (appSpecificInfo == null || appSpecificInfo.length == 0) {
			logDebug("WARNING: no appSpecificInfo on this CAP:" + srcCapId);
			return null;
		}
	}
	else {
		logDebug("**WARNING: Failed to get appSpecificInfo: " + s_result.getErrorMessage());
		return null;
	}

	for (var loopk in appSpecificInfo)
		if (!exists(appSpecificInfo[loopk].getCheckboxType(), ignoreArray)) {
			var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
			sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
			sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
			sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());
			//3. Edit ASI on target CAP (Copy info from source to target)
			aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
		}
}


function sendSMS(messageReceiver,messageBody)
        {
        /*------------------------------------------------------------------------------------------------------/
        | START Location Configurable Parameters
        | Parameters should be set in the 'SMS_INTERFACE_PARAMETERS' standard choice, only default values
               | should be updated in the below code block
        /------------------------------------------------------------------------------------------------------*/
               var wsURL = lookup("SMS_INTERFACE_PARAMETERS","wsURL");
               if(wsURL=="null") wsURL = "";
               var wsUser = lookup("SMS_INTERFACE_PARAMETERS","wsUsername");
               if(wsUser =="null") wsUser = "";
               var wsPassword = lookup("SMS_INTERFACE_PARAMETERS","wsPassword");
               if(wsPassword  =="null") wsPassword = "";
               var wsSOAPAction = lookup("SMS_INTERFACE_PARAMETERS","wsSOAPAction");
               if(wsSOAPAction =="null") wsSOAPAction = "";
 
               var credAgentID = lookup("SMS_INTERFACE_PARAMETERS","credAgentID");
               if(credAgentID =="null") credAgentID = "";
               var credUserName = lookup("SMS_INTERFACE_PARAMETERS","credUsername");
               if(credUserName =="null") credUserName = "";
               var credPassword = lookup("SMS_INTERFACE_PARAMETERS","credPassword");
               if(credPassword =="null") credPassword = "";
               var messageFrom = lookup("SMS_INTERFACE_PARAMETERS","messageFrom");
               if(messageFrom =="null") messageFrom = "DPE";
               var messageUnicode = lookup("SMS_INTERFACE_PARAMETERS","messageUnicode");
               if(messageUnicode =="null") messageUnicode = "true";
        /*------------------------------------------------------------------------------------------------------/
        | END Location Configurable Parameters
        /------------------------------------------------------------------------------------------------------*/
 
      soapOut = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\"><soap12:Body><SendSMS xmlns=\"http://SMService\"><SendSMSRequest><MessageDataContractMessagePart><From xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></From><Receiver xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></Receiver><Body xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></Body><IsUniCode xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></IsUniCode></MessageDataContractMessagePart><CredentialsPart><AgentId xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></AgentId><UserName xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></UserName><Password xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></Password></CredentialsPart></SendSMSRequest></SendSMS></soap12:Body></soap12:Envelope>"
     
      soapOut = replaceNode(soapOut,"AgentId",credAgentID)
                 soapOut = replaceNode(soapOut,"UserName",credUserName)
                 soapOut = replaceNode(soapOut,"Password",credPassword)
                 soapOut = replaceNode(soapOut,"From",messageFrom)
                 soapOut = replaceNode(soapOut,"Receiver",messageReceiver)
                 soapOut = replaceNode(soapOut,"Body",messageBody)
                 soapOut = replaceNode(soapOut,"IsUniCode",messageUnicode)  
 
                
        returnObj = aa.util.httpPostToSoapWebService(wsURL, soapOut, wsUser, wsPassword, wsSOAPAction);
 
        if (!returnObj.getSuccess())
                {
                logDebug("*SOAP ERROR Type******\n" + returnObj.getErrorType() + "\n");
               logDebug("*SOAP ERROR Message******\n" + returnObj.getErrorMessage() + "\n");
                }
        else
                {
                              logDebug("****** SOAP Response ******\n" + returnObj.getOutput() + "\n");
                }
        }
 
function replaceNode(fString,fName,fContents)
        {
         var fValue = "";
        var startTag = "<"+fName;
         var endTag = "</"+fName+">";
                              // Take into consideration tag namespace, if any.
                              var startPos = fString.indexOf(">", fString.indexOf(startTag)) + 1;
                 endPos = fString.indexOf(endTag);
                 // make sure startPos and endPos are valid before using them
                 if (startPos > 0 && startPos <= endPos)
                                {
                                  fValue = fString.substring(0,startPos) + fContents  + fString.substring(endPos);
                                        return unescape(fValue);
                        }
 
        }        