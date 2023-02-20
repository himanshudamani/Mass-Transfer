/** 
 * Name : sal_tableController
 * Description :  Controller for All Child Components of: massTransferRecordSal
 * Module : Mass Transfer Functionality on Account Tab
 **/
public with sharing class sal_tableController 
{
   /**    
    * Purpose: This method is used to fetch record list at lwc datatables    
    * Input: Object Name and UserId    
    * Output: List<sObject> 
    **/
   @AuraEnabled(cacheable=true)
    public static List<sObject> getRecordList(String objName,String userId){
          List<sObject> recordList = new List<sObject>();
          String query = '';
          if( String.isNotBlank(objName) || String.isNotBlank(userId)){
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
          }
          

          try{
               recordList = database.query(query);
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
     * Purpose: This method is used to fetch user records at lwc pills   
     * Input: Search Term, Object Name and Filter   
     * Output: List<sObject> 
     **/  
    @AuraEnabled(cacheable=true)
    public static List<sObject> searchLookupPill(String searchTerm, string objName, String filter, String label) {
        String query = '';
        List<sObject> lookUpList = new List<sObject>();
        if(String.isNotBlank(objName)){
               if(String.isNotBlank(filter)){
                    if(String.isBlank(searchTerm)){
                         query = 'Select Id, Name from '+objName+' Where LastViewedDate != NULL AND Id !=\''+filter+'\'';
                    }
                    else{
                         query = 'Select Id, Name from '+objName+' Where Name Like  \'%' + searchTerm + '%\' AND Id !=\''+filter+'\'';
                    }
               }
               else {
                    if(String.isBlank(searchTerm)){
                         query = 'Select Id, Name from '+objName+' Where LastViewedDate != NULL';
                    }
                    else {
                         query = 'Select Id, Name from '+objName+' Where Name Like  \'%' + searchTerm + '%\'';
                    }
               }
               if(label == 'Transfer To'){
                    query += ' AND IsActive = true';
               }
               query+= ' ORDER BY LastViewedDate DESC LIMIT  5';
         }
        
          try{
               lookUpList = database.query(query);
               if(!lookUpList.isEmpty())
               {
                    return lookUpList;
               }
               else 
               {
                    return null;
               }
          }
          catch(Exception e){
               System.debug('An error occurred while retriving the records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while retriving the records: ' + e.getMessage());
          }
    }

    /**      
     * Purpose: This method is used to update record's owner   
     * Input: List of record Ids, User whom to transfer and Object Name 
     * Output: void
     **/
    @AuraEnabled
    public static void  updateSelectedRecords(List<Id> selectedRecIdList, String userId, String objName)
    {
          List<sObject> objList = new List<sObject>();
          List<sObject> recordList = new List<sObject>();
          String query ='';
          if(String.isNotBlank(objName)){
               query = 'SELECT Id FROM ' + objName + ' WHERE Id IN :selectedRecIdList';
          }
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
     * Purpose: This method is used to update record's owner   
     * Input: List of record Ids, User whom to transfer and Object Name(FOR AccTM and OppTM) 
     * Output: void
     **/
     @AuraEnabled
     public static void updateTeamMemRecords(List<Id> selectedRecIdList, String userId, String objName) {
          String query = 'SELECT ';
          List<sObject> cloneList = new List<sObject>(); //list to clone records
          Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
          List<sObject> records = new List<sObject>();
         if(String.isNotBlank(objName)){
               Map<String, Schema.SObjectField> fieldMap = schemaMap.get(objName).getDescribe().fields.getMap();
               for (String fieldName: fieldMap.keySet()) {
                         query += fieldName + ',';
               }
               query = query.substring(0, query.length() - 1); // remove the last comma
               query += ' FROM ' + objName + ' WHERE Id IN :selectedRecIdList';
          }
         Savepoint sp = Database.setSavepoint();
         try{ 
               records = Database.query(query);
               if(records.isEmpty()){
                    system.debug('records is empty !!');
               }
               else{
                    for (sObject tm : records) {
                         sObject cloneTm = tm.clone(false, true, false, false);
                         cloneTm.put('UserId', userId);
                         cloneList.add(cloneTm);
                    }
                    insert cloneList;
                    delete records;
               }
          } catch (Exception e) {
             Database.rollback(sp);
             System.debug('An error occurred while updating records: ' + e.getMessage());
             throw new AuraHandledException('An error occurred while updating the records: ' + e.getMessage());   
         }
     }     

     /**      
     * Purpose: This method is used to get Account Approval process records  
     * Input: User Id and Dropdown label 
     * Output: List<Account>
     **/
     @AuraEnabled(cacheable=true)
     public static List<Account> accountApprovalDataGet(Id userId, String label){
          List<Account> accList = new List<Account>();
          String query = 'Select Id, Name, CVIF__c, OwnerId, Owner.Name, Proposed_Account_Owner__c, Proposed_Account_Owner__r.Name, userWhoProposedNewOwner__c, UserWhoProposedNewOwner__r.Name from Account where Status__c = \'In Progress\' and ';
          if(label.equals('Approval Request where User is proposed owner of Account') && String.isNotBlank(userId)){
               query += 'Proposed_Account_Owner__c =:userId';
          }
          else if(label.equals('Approval Request where User is Current owner of Account') && String.isNotBlank(userId)){
               query += 'OwnerId =:userId and Proposed_Account_Owner__c != null';
          }
          else if(label.equals('Approval Request where User is the Approver') && String.isNotBlank(userId)){
               Set<Id> tempIdList = new Set<Id>();
               List<ProcessInstanceWorkItem> piwiList = [select ProcessInstance.TargetObjectId 
                                                       from ProcessInstanceWorkItem 
                                                       where ActorId =: userId];
               for(ProcessInstanceWorkItem pw :piwiList){
                    tempIdList.add(pw.ProcessInstance.TargetObjectId);
                }
                query += 'Id in: tempIdList and Proposed_Account_Owner__c != null'; 
          }
          else if(label.equals('Approval Request initiated by User') && String.isNotBlank(userId)){
               query += 'userWhoProposedNewOwner__c =:userId and Proposed_Account_Owner__c != null';
          }

          try{
               accList = Database.query(query);
               if(!accList.isEmpty())
               {
                    return accList;
               }
               else 
               {
                    return null;
               }
          }
          catch (Exception e) {
               System.debug('An error occurred while retriving records: ' + e.getMessage());
               throw new AuraHandledException('An error occurred while retriving the records: ' + e.getMessage());   
          }
     }

     /**     
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