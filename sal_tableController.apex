/** 
 * Name : sal_tableController
 * Description :  Controller for All Child Components of: massTransferRecordSal
 * Module : Mass Transfer Functionality on Account Tab
 **/
public with sharing class sal_tableController 
{
   /**    
    * Type: GET    
    * Name: getRecordList   
    * Purpose: This method is used to fetch record list at lwc datatables    
    * Input: Object Name and UserId    
    * Output: List<sObject> 
    **/
   @AuraEnabled(cacheable=true)
    public static List<sObject> getRecordList(String objName,String userId){
          List<sObject> recordList = new List<sObject>();
          String query = '';
          if(objName == 'account' )
          {
               query = 'Select Id,Name,Industry,Type,CVIF__c From Account where OwnerId =: userId and Primary_Account__c = True and Customer_Status__c = \'Active\'';
          }
          if(objName == 'lead')
          {
               query = 'Select Id, Name,Company,Status From Lead where OwnerId =: userId and Status != \'Qualified\'';
          }
          if(objName == 'contact')
          {
               query = 'Select Id,Account.Name, Email,Contact_Name_Title__c, AccountId From Contact where OwnerId =: userId';
          }
          if(objName == 'opportunity')
          {
               query = 'Select Id, Name, Account.Name, StageName, Owner.Name From Opportunity where OwnerId =: userId';
          }
          if(objName == 'accountTeamMember')
          {
               query = 'Select User.Name, TeamMemberRole,Account.Name From AccountTeamMember where UserId =: userId and Account.Primary_Account__c = True';
          }
          if(objName == 'opportunityTeamMember')
          {
               query = 'Select User.Name, TeamMemberRole,Opportunity.Name From OpportunityTeamMember where UserId =: userId';
          }

          try{
               if( objName != '' && userId != '')
               {
               recordList = database.query(query);
               }
               if(!recordList.isEmpty())
               {
                    return recordList;
               }
               else 
               {
                    return null;
               }
          }
          catch(Exception e){
               System.debug('User Id-->'+userId+' '+'Object Name-->'+objName);
               System.debug('An error occurred while retriving the records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while retriving the records: ' + e.getMessage());
          }
     }

     /**    
     * Type: GET    
     * Name: searchLookupPill   
     * Purpose: This method is used to fetch user records at lwc pills   
     * Input: Search Term, Object Name and Filter   
     * Output: List<sObject> 
     **/  
    @AuraEnabled(cacheable=true)
    public static List<sObject> searchLookupPill(String searchTerm, string objName, String filter) {
        String query = '';
        List<sObject> lookUpList = new List<sObject>();
        if(filter != null && filter != ''){
               if(searchTerm == null || searchTerm == ''){
                    query = 'Select Id, Name from '+objName+' Where LastViewedDate != NULL AND Id !=\''+filter+'\' ORDER BY LastViewedDate DESC LIMIT  5';
               }
               else{
                    query = 'Select Id, Name from '+objName+' Where Name Like  \'%' + searchTerm + '%\' AND Id !=\''+filter+'\' ORDER BY LastViewedDate ASC LIMIT  5';
               }
          }
        else {
               if(searchTerm == null || searchTerm == ''){
                    query = 'Select Id, Name from '+objName+' Where LastViewedDate != NULL ORDER BY LastViewedDate DESC LIMIT  5';
               }
               else {
                    query = 'Select Id, Name from '+objName+' Where Name Like  \'%' + searchTerm + '%\' ORDER BY LastViewedDate DESC LIMIT  5';
               }
          }
          try{
               lookUpList = database.query(query);
          }
          catch(Exception e){
               System.debug('An error occurred while retriving the records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while retriving the records: ' + e.getMessage());
          }
        return lookUpList;
    }

    /**    
     * Type: SET   
     * Name: updateSelectedRecords   
     * Purpose: This method is used to update record's owner   
     * Input: List of record Ids, User whom to transfer and Object Name 
     * Output: void
     **/
    @AuraEnabled
    public static Void  updateSelectedRecords(List<Id> selectedRecIdList, String userId, String objName)
    {
          List<sObject> objList = new List<sObject>();
          List<sObject> recordList = new List<sObject>();
          String query = 'SELECT Id FROM ' + objName + ' WHERE Id IN :selectedRecIdList';
          
          try 
          {
               recordList = database.query(query);
               if(!recordList.isEmpty()){
                    for (sObject obj : recordList) 
                    {
                         obj.put('OwnerId', userId);
                         objList.add(obj);
                    }
               }
               update objList;
          } 
          catch (Exception e) 
          {
               System.debug('An error occurred while updating the records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while updating the records: ' + e.getMessage());      
          }
     }

     /**    
     * Type: SET   
     * Name: updateTeamMemRecords   
     * Purpose: This method is used to update record's owner   
     * Input: List of record Ids, User whom to transfer and Object Name(FOR AccTM and OppTM) 
     * Output: void
     **/
     @AuraEnabled
     public static void updateTeamMemRecords(List<Id> selectedRecIdList, String userId, String objName) {
         List<sObject> cloneList = new List<sObject>(); //list to clone records
         Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
         Map<String, Schema.SObjectField> fieldMap = schemaMap.get(objName).getDescribe().fields.getMap();
         String query = 'SELECT ';
         for (String fieldName: fieldMap.keySet()) {
               query += fieldName + ',';
         }
         query = query.substring(0, query.length() - 1); // remove the last comma
         query += ' FROM ' + objName + ' WHERE Id IN :selectedRecIdList';
         List<sObject> records = new List<sObject>();
         Savepoint sp = Database.setSavepoint();
         try{ 
               if(records.isEmpty()){
                    records = Database.query(query);
               }
               else{
                    system.debug('records is empty !!');
               }
          
               for (sObject tm : records) {
                    sObject cloneTm = tm.clone(false, true, false, false);
                    cloneTm.put('UserId', userId);
                    cloneList.add(cloneTm);
               }
               insert cloneList;
               delete records;
          } catch (Exception e) {
             Database.rollback(sp);
             System.debug('An error occurred while updating records: ' + e.getMessage());
             throw new AuraHandledException('An error occurred while updating the records: ' + e.getMessage());   
         }
     }     

     /**    
     * Type: GET   
     * Name: accountApprovalDataGet   
     * Purpose: This method is used to get Account Approval process records  
     * Input: User Id and Dropdown label 
     * Output: List<Account>
     **/
     @AuraEnabled(cacheable=true)
     public static List<Account> accountApprovalDataGet(Id userId, String label){
          List<Account> accList = new List<Account>();
          String query = 'Select Id, Name, CVIF__c, OwnerId, Owner.Name, Proposed_Account_Owner__c, Proposed_Account_Owner__r.Name, userWhoProposedNewOwner__c, UserWhoProposedNewOwner__r.Name from Account where Status__c = \'In Progress\' and ';
          if(label.equals('Approval Request where User is proposed owner of Account')){
               query += 'Proposed_Account_Owner__c =:userId';
          }
          else if(label.equals('Approval Request where User is Current owner of Account')){
               query += 'OwnerId =:userId and Proposed_Account_Owner__c != null';
          }
          else if(label.equals('Approval Request where User is the Approver')){
               Set<Id> tempIdList = new Set<Id>();
               List<ProcessInstanceWorkItem> piwiList = [select ProcessInstance.TargetObjectId from ProcessInstanceWorkItem where ActorId =: userId];
               for(ProcessInstanceWorkItem pw :piwiList){
                    tempIdList.add(pw.ProcessInstance.TargetObjectId);
                }
                query += 'Id in: tempIdList and Proposed_Account_Owner__c != null'; 
          }
          else if(label.equals('Approval Request initiated by User')){
               query += 'userWhoProposedNewOwner__c =:userId and Proposed_Account_Owner__c != null';
          }

          try{
               accList = Database.query(query);
          }
          catch (Exception e) {
               System.debug('An error occurred while retriving records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while retriving the records: ' + e.getMessage());   
          }

          return accList;
     }

     /**    
     * Type: SET   
     * Name: approveOrRejectAccounts   
     * Purpose: This method is used approve or reject Accounts   
     * Input: List of record Ids, User who is approving/rejecting and action(app/rej) 
     * Output: void
     **/
     @AuraEnabled
     public static void approveOrRejectAccounts(List<Id> IdList, string userName, string action)
     {
          List<ProcessInstanceWorkitem> pItemList = new List<ProcessInstanceWorkItem>();
          List<Id> targetObjectIds = new List<Id>();
          List<Approval.ProcessWorkitemRequest> reqList = new List<Approval.ProcessWorkitemRequest>();

          for(Id id2 : IdList)
          {
               if(Approval.isLocked(id2))
               {
                    targetObjectIds.add(id2);
               }
          }
          system.debug('targetObjectIds: '+targetObjectIds);
          try{
               if (!targetObjectIds.isEmpty())
               {
                    pItemList = [Select Id, actor.Email from ProcessInstanceWorkitem where ProcessInstance.TargetObjectId in :targetObjectIds];
               }

               if(!pItemList.isEmpty())
               {
                    for (ProcessInstanceWorkitem pItem : pItemList) {
                         if (pItem.Id != NULL) {
                              Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
                              req.setComments(action + 'ed by '+userName);
                              req.setAction(action);
                              req.setWorkitemId(pItem.Id);
                              reqList.add(req);
                         }
                    }
                    List<Approval.ProcessResult> result =  Approval.process(reqList);
               }
          }
          catch(Exception e){
               System.debug('An error occurred while ' + action + 'ing records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while ' + action + 'ing the records: ' + e.getMessage());
          }
     }
}
