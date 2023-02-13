import { LightningElement, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import LightningConfirm from 'lightning/confirm';
import SystemModstamp from '@salesforce/schema/Account.SystemModstamp';

export default class Practice_ChangeOwnerCmp extends NavigationMixin(LightningElement) 
{
  showAccounts = false;
  showContacts = false;
  showOpp = false;
  showLeads = false;
  showATM = false;
  showOTM = false;
  showAP = false;
  searchAccount = false;
  searchApproval = false;
  searchContact = false;
  searchLead = false;
  searchOpportunity = false;
  searchAccountTeamMember = false;
  searchOpportunityTeamMember = false;
  @track objName;
  @track account =[] ;
  @track lead =[] ;
  @track contact =[] ;
  @track opportunity =[] ;
  @track ApprovalProcess = [];
  @track AccountTeamMember =[] ;
  @track OpportunityTeamMember =[] ;
  @track userId = '';
  @track transferFrom;
  @track transferTo = null;
  @track selName;
  @track recordSelected = true;
  selectedTab = '';
  val = '';
  tab = '';
  showTable = false;
  boolVal ;
  disableCheckbox = true;

  connectedCallback(){
    console.log('connected callback - masstransfer');
  }

  handleCheckbox(event) 
  {
    const checked = event.target.checked;
    const name = event.target.value;
    console.log('Checkbox name-->'+name);
    let showProperty = "";
    let objProperty = "";
    let objName = "";
    
    switch (name) 
    {
        case "Account":
            showProperty = "showAccounts";
            objProperty = "account";
            objName = "searchAccount";
            break;
        case "Lead":
            showProperty = "showLeads";
            objProperty = "lead";
            objName = "searchLead";
            break;
        case "Contact":
            showProperty = "showContacts";
            objProperty = "contact";
            objName = "searchContact";
            break;
        case "Opportunity":
            showProperty = "showOpp";
            objProperty = "opportunity";
            objName = "searchOpportunity";
            break;
        case "AccountTeamMember":
            showProperty = "showATM";
            objProperty = "AccountTeamMember";
            objName = "searchAccountTeamMember";
            break;
        case "OpportunityTeamMember":
            showProperty = "showOTM";
            objProperty = "OpportunityTeamMember";
            objName = "searchOpportunityTeamMember";
            break;
        case "ApprovalProcess":
            showProperty = "showAP";
            objProperty = "ApprovalProcess";
            objName = "searchApproval";
            break;
    }
    
    this[showProperty] = checked;
    if (checked)
    {
      this[objProperty] = name;
      this.objName = name;
      this.selectedTab = event.target.value;
    } 
    else
    {
      this[objProperty] = '';
      this.objName = '';
      this.selectedTab = '';
     // this[searchProperty] = false;
    }
  }    
  /*handleObject(event, showProperty, objProperty, objName) {
    const checked = event.target.checked;
    const name = event.target.name;      
    this[showProperty] = checked;
    if (checked) {
      this[objProperty] = name;
      this.objName = name;
      this.selectedTab = event.target.value;
    } 
    else {
      this[objProperty] = '';
      this.objName = '';
      this.selectedTab = '';
     // this[searchProperty] = false;
    }
  }*/ 

  
  handleAcc(event) {
    this.handleObject(event, 'showAccounts', 'account', 'searchAccount');
    
    console.log('Handle Account Method');
  }
  handleLeads(event) {
    this.handleObject(event, 'showLeads', 'lead', 'searchLead');
    console.log('Handle Lead Method');
  }
  handleContacts(event){
    this.handleObject(event,'showContacts','contact','searchContact');
    console.log('Handle contact Method');
  }
  handleOpportunity(event){
    this.handleObject(event,'showOpp','opportunity','searchOpportunity');
    console.log('Handle opportunity Method');
  }
  handleAccountTeamMember(event){
    this.handleObject(event,'showATM','AccountTeamMember','searchAccountTeamMember');
    console.log('Handle Account Team Member Method');
  }
  handleOpportunityTeamMember(event){
    this.handleObject(event,'showOTM','OpportunityTeamMember','searchOpportunityTeamMember');
  }
  handleApprovalProcess(event){
    this.handleObject(event,'showAP','ApprovalProcess','searchApproval'); 
  }

  handleSelection(event){
    this.userId = event.detail.selectedId;
    // this.boolVal = true;
    this.disableCheckbox = false;
    this.transferFrom = event.detail.selectedName;
    
  }

  handletransferTo(event)
  {
    this.transferTo = event.detail.selectedId;
    console.log('Selected Name-->'+event.detail.selectedName);
    console.log('Selected Names 2--->'+this.transferTo);
    this.selName = event.detail.selectedName;
    
  }

  SelectRecords(){
    this.searchAccount = this.showAccounts;
    this.tab = this.selectedTab;
    this.searchContact = this.showContacts;
    this.searchLead = this.showLeads;
    this.searchOpportunity = this.showOpp;
    this.searchAccountTeamMember = this.showATM;
    this.searchOpportunityTeamMember = this.showOTM;
    this.searchApproval = this.showAP;
    this.boolVal = true;
  }

  handleProgressValueChange(event){
    this.boolVal = event.detail;
    console.log('Boolean Val in Parent-->'+this.boolVal);
    if(this.boolVal == false){
      this.showAccounts = false;
      this.showLeads = false;
      this.showContacts = false;
      this.showOpp = false;
      this.showATM = false;
      this.showOTM = false;
      this.showAP = false;
      
      /*setTimeout(() => {
          eval("$A.get('e.force:refreshView').fire();");
      }, 100); */
    }
  }

  handleRemoveTransferTo(event){
    if(event.detail == false){
      this.transferTo = null;
    }
  }

  get disableSearchBtn(){
    if(this.account != '' || this.lead != '' ||  this.contact != '' || this.opportunity != '' || this.AccountTeamMember != '' || this.OpportunityTeamMember != '' || this.ApprovalProcess != ''){
        return false;
    }
    else {
        return true;
    }
  }
    
  hideModalBox(event){
    const objChild = this.template.querySelectorAll('c-practice-custom-lookup-sal');
    //objChild.handleRemovePill();
    objChild.forEach(obj => 
    {
      obj.handleRemovePill();
    })
    
  this.disableCheckbox = true;
  
    // Navigate to the Accounts's Recent list view.
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Account',
        actionName: 'list'
      },
      state: {
        filterName: 'Recent' 
      }
    });

  }

  async confirmClose(event){
    console.log('recSelectced value: '+ this.recordSelected);
    if(this.recordSelected == false){
      const result = await LightningConfirm.open({
        message: 'Are you sure you want to close?',
        variant: 'header',
        label: 'Please Confirm',
        theme: 'error',
      });

      if(result==true){
          this.hideModalBox(event);
      }
    }
    else{
      console.log('recSelected ;'+ this.recordSelected);
      this.hideModalBox(event);
    }
  }

  handlerecordselected(event){
    this.recordSelected = event.detail.recordSelected;
  }
}
