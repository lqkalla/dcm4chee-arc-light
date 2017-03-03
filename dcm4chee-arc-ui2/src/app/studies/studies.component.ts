import {Component, ViewContainerRef} from '@angular/core';
import {Http, Headers} from "@angular/http";
import {StudiesService} from "./studies.service";
import {AppService} from "../app.service";
import {User} from "../models/user";
import {Globalvar} from "../constants/globalvar";
import {SlimLoadingBarService} from "ng2-slim-loading-bar";
import * as _ from "lodash";
import {MessagingComponent} from "../widgets/messaging/messaging.component";
import {SelectItem} from "primeng/components/common/api";
import { ViewChildren} from "@angular/core/src/metadata/di";
import {MdDialogConfig, MdDialog, MdDialogRef} from "@angular/material";
import {EditPatientComponent} from "../widgets/dialogs/edit-patient/edit-patient.component";
import {map} from "rxjs/operator/map";
import {EditMwlComponent} from "../widgets/dialogs/edit-mwl/edit-mwl.component";
import {CopyMoveObjectsComponent} from "../widgets/dialogs/copy-move-objects/copy-move-objects.component";
import {subscribeOn} from "rxjs/operator/subscribeOn";
import {ConfirmComponent} from "../widgets/dialogs/confirm/confirm.component";
import {Subscription} from "rxjs";
import {EditStudyComponent} from "../widgets/dialogs/edit-study/edit-study.component";
import {ComparewithiodPipe} from "../pipes/comparewithiod.pipe";

@Component({
    selector: 'app-studies',
    templateUrl: './studies.component.html',
    styleUrls: ['./studies.component.css']
})
export class StudiesComponent{

    // @ViewChildren(MessagingComponent) msg;

    orderby = Globalvar.ORDERBY;
    limit = 20;
    showClipboardHeaders = {
        "study":false,
        "series":false,
        "instance":false
    };
    debugpre = false;
    saveLabel = "SAVE";
    titleLabel = "Edit patient";
    rjcode = null;
    trashaktive = false;
    clipboard:any = {};
    showCheckboxes = false;
    disabled = {};
    patientmode = false;
    filter = {
        orderby: "-StudyDate,-StudyTime",
        ModalitiesInStudy:"",
        "ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate":"",
        "ScheduledProcedureStepSequence.ScheduledProcedureStepStatus":"",
        returnempty:false,
        PatientSex:"",
        PatientBirthDate:""
    };
    queryMode = "queryStudies";
    ScheduledProcedureStepSequence:any = {
        ScheduledProcedureStepStartTime:{
            from: '',
            to: ''
        },
        ScheduledProcedureStepStartDate:{
            from: this.service.getTodayDate(),
            to: this.service.getTodayDate(),
            toObject:new Date(),
            fromObject:new Date()
        }
    };
    moreMWL;
    morePatients;
    moreStudies;
    opendropdown = false;
    addPatientAttribut = "";
    lastPressedCode;
    clipboardHasScrollbar:boolean = false;
    target;
    // birthDate;
    clipBoardNotEmpty(){
        if(this.clipboard && ((_.size(this.clipboard.otherObjects) > 0) || (_.size(this.clipboard.patients) > 0))){
            return true;
        }else{
            return false;
        }
    }
    jsonHeader = new Headers({ 'Content-Type': 'application/json' });

    clearForm(){
        _.forEach(this.filter,(m,i)=>{
            if(i != "orderby"){
                this.filter[i] = "";
            }
        });
        $(".single_clear").hide();
        this.studyDate.fromObject = null;
        this.studyDate.toObject = null;
        this.studyDate.from = "";
        this.studyDate.to = "";
        this.studyTime.fromObject = null;
        this.studyTime.toObject = null;
        this.studyTime.from = "";
        this.studyTime.to = "";
        // this.birthDate = {};
        // this.birthDate.object = null;
        // this.birthDate.opened = false;
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate.fromObject = null;
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate.toObject = null;
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate.from = "";
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate.to = "";
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime.fromObject = null;
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime.toObject = null;
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime.from = "";
        this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime.to = "";
    };
    options = {genders:
                        [
                            {
                                "vr": "CS",
                                "Value":["F"],
                                "title":"Female"
                            },
                            {
                                "vr": "CS",
                                "Value":["M"],
                                "title":"Male"
                            },
                            {
                                "vr": "CS",
                                "Value":["O"],
                                "title":"Other"
                            }
                        ]
    };
    user:User;
    filterMode = "study";
    showClipboardContent = false;
    showoptionlist = false;
    orderbytext = this.orderby[2].label;
    patients = [];
    patient ={
        hide:false,
        modus:'patient',
        showmwls:true
    };
    isRole:any;
    study =  {
        modus:'study',
        selected:false
    };
    series = {
        modus:'series',
        selected:false
    };
    instance = {
        modus:'instance',
        selected:false
    };
    select_show=false;
    aes:any;
    aet:any;
    aetmodel:any;
    advancedConfig:boolean = false;
    showModalitySelector:boolean = false;
    modalities:any;
    showMore:boolean = false;
    attributeFilters:any = {};
    exporters;
    exporterID = null;
    rjnotes;
    reject;
    studyDate:any = { from: this.service.getTodayDate(), to: this.service.getTodayDate(),toObject:new Date(),fromObject:new Date()};
    studyTime:any = { from: '', to: ''};
    hoverdic = [
        ".repeat0 .thead .tr_row",
        ".repeat1_hover",
        ".repeat2_hover",
        ".repeat3_hover",
        ".repeat4_hover"
    ];
    visibleHeaderIndex = 0;
    /*
     * Add the class fixed to the main_content when the user starts to scroll (reached the main_content position)
     * so we can user that as layer so the user can't see the table above the filters when he scrolls.
     */
    headers = [
        ".main_content"
    ];
    items = {};
    anySelected;
    lastSelectedObject = {modus:""};
    keysdown:any = {};
    lastSelect:any;
    selected:any = {
        hasPatient:false
    };
    pressedKey;
    selectModality(key){
        this.filter.ModalitiesInStudy = key;
        this.filter['ScheduledProcedureStepSequence.Modality'] = key;
        $(".Modality").show();
        this.showModalitySelector=false;
    };

    dialogRef: MdDialogRef<any>;
    subscription:Subscription;

    constructor(public $http: Http, public service:StudiesService, public mainservice:AppService,public cfpLoadingBar:SlimLoadingBarService, public messaging:MessagingComponent, public viewContainerRef: ViewContainerRef ,public dialog: MdDialog, public config: MdDialogConfig) {
        // $('.clockpicker').clockpicker()
        //     .find('input').change(function(){
        //     // TODO: time changed
        //     console.log(this.value);
        // });

        this.cfpLoadingBar.interval = 200;
        this.modalities = Globalvar.MODALITIES;
        console.log("modalities",this.modalities);
        this.initAETs(1);
        this.initAttributeFilter("Patient", 1);
        this.initExporters(1);
        this.initRjNotes(1);
        // this.user = this.mainservice.user;
        if(!this.mainservice.user){
            // console.log("in if studies ajax");
            this.mainservice.user = this.mainservice.getUserInfo().share();
            let $this = this;
            this.mainservice.user
                .subscribe(
                    (response) => {
                        $this.user.user  = response.user;
                        $this.mainservice.user.user = response.user;
                        $this.user.roles = response.roles;
                        $this.mainservice.user.roles = response.roles;
                        $this.isRole = (role)=>{
                            if(response.user === null && response.roles.length === 0){
                                return true;
                            }else{
                                if(response.roles && response.roles.indexOf(role) > -1){
                                    return true;
                                }else{
                                    return false;
                                }
                            }
                        };
                    },
                    (response) => {
                        // $this.user = $this.user || {};
                        console.log("get user error");
                        $this.user.user = "user";
                        $this.mainservice.user.user = "user";
                        $this.user.roles = ["user","admin"];
                        $this.mainservice.user.roles = ["user","admin"];
                        $this.isRole = (role)=>{
                            if(role === "admin"){
                                return false;
                            }else{
                                return true;
                            }
                        };
                    }
                );

        }else{
            this.user = this.mainservice.user;
            this.isRole = this.mainservice.isRole;
            // console.log("isroletest",this.user.applyisRole("admin"));
        }
        this.hoverdic.forEach((m, i)=>{
            let $this = this;
            $(document.body).on("mouseover mouseleave",m,function(e){

                if(e.type === "mouseover" && $this.visibleHeaderIndex != i){
                    $($this).addClass('hover');
                    $(m).addClass('hover');
                    $(".headerblock .header_block .thead").addClass('animated fadeOut');
                    setTimeout(function(){
                        $this.visibleHeaderIndex = i;
                        $(".div-table .header_block .thead").removeClass('fadeOut').addClass('fadeIn');
                    }, 200);
                    setTimeout(function(){
                        $(".headerblock .header_block .thead").removeClass('animated');
                    },200);
                }
            });
        });

        console.log("thisrole=",this.isRole);
        let $this = this;
        $(document).keydown(function(e){

            $this.pressedKey = e.keyCode;
            // Do we already know it's down?
            if ($this.keysdown && $this.keysdown[e.keyCode]) {
                // Ignore it
                return;
            }
            console.log("$this.keysdown",this.keysdown);
            console.log("e.keyCode",e.keyCode);
            console.log("isrole admin=",$this.isRole("admin"));
            // console.log("isrole admin=",this.mainservice.isRole);
            // Remember it's down
            let validKeys = [16,17,67,77,86,88,91,93,224];
            if(validKeys.indexOf(e.keyCode) > -1){
                console.log("in if ");
                $this.keysdown[e.keyCode] = true;
            }
            //ctrl + c clicked
            if($this.keysdown && ($this.keysdown[17]===true || $this.keysdown[91]===true || $this.keysdown[93]===true || $this.keysdown[224]===true) && $this.keysdown[67]===true && $this.isRole("admin")){
                console.log("ctrl + c");
                $this.ctrlC();
                $this.keysdown = {};
            }
            //ctrl + v clicked
            if($this.keysdown && ($this.keysdown[17]===true || $this.keysdown[91]===true || $this.keysdown[93]===true || $this.keysdown[224]===true) && $this.keysdown[86]===true && $this.isRole("admin")){
                $this.ctrlV();
                $this.keysdown = {};
            }
            //ctrl + m clicked
            if($this.keysdown && ($this.keysdown[17]===true || $this.keysdown[91]===true || $this.keysdown[93]===true || $this.keysdown[224]===true) && $this.keysdown[77]===true && $this.isRole("admin")){
                $this.merge();
                $this.keysdown = {};
            }
            //ctrl + x clicked
            if($this.keysdown && ($this.keysdown[17]===true || $this.keysdown[91]===true || $this.keysdown[93]===true || $this.keysdown[224]===true) && $this.keysdown[88]===true && $this.isRole("admin")){
                console.log("ctrl + x");
                $this.ctrlX();
                $this.keysdown = {};
            }

        });
        $(document).keyup(function(e){
            console.log("keyUP",e.keyCode);
            $this.pressedKey = null;
            console.log("$this.keysdown",this.keysdown);
            delete $this.keysdown[e.keyCode];
        });

        //Detect in witch column is the mouse position and select the header.
        $(document.body).on("mouseover mouseleave",".hover_cell",function(e){
            var $this = this;
            if(e.type === "mouseover"){
                $(".headerblock > .header_block > .thead").each((i, m)=>{
                    $(m).find(".cellhover").removeClass("cellhover");
                    $(m).find(".th:eq("+$($this).index()+")").addClass('cellhover');
                });
            }else{
                $(".headerblock > .header_block > .thead > .tr_row > .cellhover").removeClass("cellhover");
            }
        });

        this.headers.forEach((m, i)=>{
            this.items[i] = this.items[i] || {};
            let $this = this;
            $(window).scroll(()=>{
                if($(m).length){
                    $this.items[i].itemOffset = $(m).offset().top;
                    $this.items[i].scrollTop = $(window).scrollTop();
                    if($this.items[i].scrollTop >= $this.items[i].itemOffset){
                        $this.items[i].itemOffsetOld = $this.items[i].itemOffsetOld || $(m).offset().top;
                        $(".headerblock").addClass('fixed');
                    }
                    if($this.items[i].itemOffsetOld  && ($this.items[i].scrollTop < $this.items[i].itemOffsetOld)){
                        $(".headerblock").removeClass('fixed');
                    }
                }
            });
        });

        this.subscription = this.mainservice.createPatient$.subscribe(patient => {
            console.log("patient in subscribe messagecomponent ",patient);
            this.createPatient();
        });
    }

    // initAETs(retries) {
    //
    //     this.$http.get("/dcm4chee-arc/aets")
    //         .map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
    //         .subscribe(
    //             (res) => {
    //                 this.aes = this.service.getAes(this.user, res);
    //                 this.aet = this.aes[0].title.toString();
    //                 this.aetmodel = this.aes[0];
    //             },
    //             (res)=>{
    //                 if (retries)
    //                     this.initAETs(retries-1);
    //             }
    //         );
    // }

    /*
    * @confirmparameters is an object that can contain title, content
    * */
    confirm(confirmparameters){
        this.config.viewContainerRef = this.viewContainerRef;
        this.dialogRef = this.dialog.open(ConfirmComponent, this.config);
        this.dialogRef.componentInstance.parameters = confirmparameters;
/*        this.dialogRef.afterClosed().subscribe(result => {
            if(result){
                console.log("result", result);
            }else{
                console.log("false");
            }
        });*/
        return this.dialogRef.afterClosed();
    };
    timeClose(){
        console.log("closetest",this.studyTime);
    }
    selectTime(state){
        console.log("on selectitme",this.studyTime);
        let obj = state+"Object";
        try{
            let n = this.studyTime[obj].getHours();
            let m = (this.studyTime[obj].getMinutes()<10?'0':'') + this.studyTime[obj].getMinutes();
            this.studyTime[state] = n+":"+m;
        }catch (e){
            console.log("in catch ",this.studyTime);
        }
        console.log("after set ",this.studyTime);
    }
    extendedFilter(...args: any[]){
        console.log("args",arguments);
        if(args.length > 1){
            args[1].preventDefault();
            args[1].stopPropagation();
        }
            this.advancedConfig = args[0];
            if($('.div-table *').length > 0){
                $('.div-table').removeAttr( 'style' );
                    setTimeout(function() {
                        let marginTop:any = $('.div-table').css('margin-top');
                        if(marginTop){
                            marginTop = marginTop.replace(/[^0-9]/g, '');
                            let outerHeight:any = $('.headerblock').outerHeight();
                            if(marginTop && marginTop < outerHeight && args[0] === true){
                                $('.div-table.extended').css('margin-top', outerHeight);
                            }
                        }
                    }, 50);
            }
    }
    clearClipboard = function(){
        this.clipboard = {};
        this.selected['otherObjects'] = {};
    };
    queryStudies(offset){
        this.queryMode = "queryStudies";
        this.moreMWL = undefined;
        this.morePatients = undefined;
        this.cfpLoadingBar.start();
        if (offset < 0 || offset === undefined) offset = 0;
        let $this = this;
        this.service.queryStudies(
            this.rsURL(),
            this.createQueryParams(offset, this.limit+1, this.createStudyFilterParams())
        ).subscribe((res) => {

            $this.patients = [];
            //           $this.studies = [];
            $this.morePatients = undefined;
            $this.moreStudies = undefined;
            if(_.size(res) > 0){
                //Add number of patient related studies manuelly hex(00201200) => dec(2101760)
                let index = 0;
                while($this.attributeFilters.Patient.dcmTag[index] && ($this.attributeFilters.Patient.dcmTag[index] < 2101760)){
                    index++;
                }
                $this.attributeFilters.Patient.dcmTag.splice(index, 0, 2101760);

                var pat, study, patAttrs, tags = $this.attributeFilters.Patient.dcmTag;
                console.log("res",res);
                res.forEach(function (studyAttrs, index) {
                    patAttrs = {};
                    $this.extractAttrs(studyAttrs, tags, patAttrs);
                    if (!(pat && _.isEqual(pat.attrs, patAttrs))) { //angular.equals replaced with Rx.helpers.defaultComparer
                        pat = {
                            attrs: patAttrs,
                            studies: [],
                            showAttributes: false
                        };
                        // $this.$apply(function () {
                        $this.patients.push(pat);
                        // });
                    }
                    study = {
                        patient: pat,
                        offset: offset + index,
                        moreSeries: false,
                        attrs: studyAttrs,
                        series: null,
                        showAttributes: false,
                        fromAllStudies:false,
                        selected:false
                    };
                    pat.studies.push(study);
                    $this.extendedFilter(false);
                    //                   $this.studies.push(study); //sollte weg kommen
                });
                if ($this.moreStudies = (res.length > $this.limit)) {
                    pat.studies.pop();
                    if (pat.studies.length === 0){
                        $this.patients.pop();
                    }
                    // this.studies.pop();
                }
                console.log("patients=",$this.patients[0]);
                // $this.mainservice.setMessage({
                //     "title": "Info",
                //     "text": "Test",
                //     "status": "info"
                // });
                $this.cfpLoadingBar.complete();
            } else {
                console.log("in else setmsg");
                $this.patients = [];

                $this.mainservice.setMessage({
                    "title": "Info",
                    "text": "No matching Studies found!",
                    "status": "info"
                });
                $this.cfpLoadingBar.complete();
            }
            // setTimeout(function(){
            //     togglePatientsHelper("hide");
            // }, 1000);
           $this.cfpLoadingBar.complete();
        },
            (err)=>{
                console.log("in error",err);
                $this.patients = [];
                $this.mainservice.setMessage({
                    "title": "Info",
                    "text": "No matching Studies found!",
                    "status": "info"
                });
                $this.cfpLoadingBar.complete();
            }
        );
    };
    editMWL(patient, patientkey, mwlkey, mwl){
        this.saveLabel = "SAVE";
        this.titleLabel = "Edit MWL of patient ";
        this.titleLabel += ((_.hasIn(patient,'attrs.00100010.Value.0.Alphabetic')) ? "<b>" + patient.attrs["00100010"].Value[0]["Alphabetic"] + "</b>" : " ");
        this.titleLabel += ((_.hasIn(patient,'attrs.00100020.Value.0')) ? " with ID: <b>" + patient.attrs["00100020"].Value[0] + "</b>" : "");
        this.modifyMWL(patient, "edit", patientkey, mwlkey, mwl);
    };
    createMWL(patient){
        let mwl:any = {
            "attrs":{
                "00400100": {
                    "vr": "SQ",
                    "Value": [{
                        "00400001": { "vr": "AE","Value":[""]}
                    }]
                },
                "0020000D": { "vr": "UI", "Value":[""]},
                "00400009": { "vr": "SH", "Value":[""]},
                "00080050": { "vr": "SH", "Value":[""]},
                "00401001": { "vr": "SH", "Value":[""]}
            }
        };
        this.titleLabel = "Create new MWL";
        // modifyStudy(patient, "create");
        this.modifyMWL(patient, "create", "", "", mwl);
    };
    modifyMWL(patient, mode, patientkey, mwlkey, mwl){
        let originalMwlObject = _.cloneDeep(mwl);
        this.config.viewContainerRef = this.viewContainerRef;

        this.lastPressedCode = 0;
        if(mode === "edit"){
            _.forEach(mwl.attrs,function(value, index) {
                var checkValue = "";
                if(value.Value && value.Value.length){
                    checkValue = value.Value.join("");
                }
                if(!(value.Value && checkValue != "")){
                    delete mwl.attrs[index];
                }
                if(value.vr === "DA" && value.Value && value.Value[0]){
/*                    var string = value.Value[0];
                    string = string.replace(/\./g,"");
                    var yyyy = string.substring(0,4);
                    var MM = string.substring(4,6);
                    var dd = string.substring(6,8);
                    var timestampDate   = Date.parse(yyyy+"-"+MM+"-"+dd);
                    var date          = new Date(timestampDate);
                    $scope.dateplaceholder[index] = date;*/
                    console.log("in date",value.Value);
                }
            });
            if(mwl.attrs["00400100"].Value[0]["00400002"] && !mwl.attrs["00400100"].Value[0]["00400002"].Value){
                mwl.attrs["00400100"].Value[0]["00400002"]["Value"] = [""];
            }
        }

        // this.config.width = "800";

        let $this = this;
        this.service.getMwlIod().subscribe((res)=>{
            $this.service.patientIod = res;
            console.log("berfore set mwl",mwl);
            console.log("after initemptyvalue");
            let iod = $this.service.replaceKeyInJson(res, "items", "Value");
            let mwlFiltered = _.cloneDeep(mwl);
            mwlFiltered.attrs = new ComparewithiodPipe().transform(mwl.attrs,iod);
            $this.service.initEmptyValue(mwlFiltered.attrs);

            $this.dialogRef = $this.dialog.open(EditMwlComponent, $this.config);
            $this.dialogRef.componentInstance.iod = iod
            $this.dialogRef.componentInstance.dropdown = $this.service.getArrayFromIod(res);
            $this.dialogRef.componentInstance.mwl = mwlFiltered;
            $this.dialogRef.componentInstance.mwlkey = mwlkey;
            console.log("$this.savelabel",$this.saveLabel);
            $this.dialogRef.componentInstance.saveLabel = $this.saveLabel;
            $this.dialogRef.componentInstance.titleLabel = $this.titleLabel;
            $this.dialogRef.afterClosed().subscribe(result => {
                //If user clicked save
                console.log("result",result);
                if(result){
                    $this.service.clearPatientObject(mwlFiltered.attrs);
                    $this.service.convertStringToNumber(mwlFiltered.attrs);
                    // StudiesService.convertDateToString($scope, "mwl");
                    var local = {};

                    $this.service.appendPatientIdTo(patient.attrs,local);

                    _.forEach(mwlFiltered.attrs,function(m, i){
                        if(res[i]){
                            local[i] = m;
                        }
                    });
                    _.forEach(mwlFiltered.attrs, function(m, i){
                        if((res && res[i] && res[i].vr != "SQ") && m.Value && m.Value.length === 1 && m.Value[0] === ""){
                            delete mwlFiltered.attrs[i];
                        }
                    });
                    console.log("on post",local);
                    $this.$http.post(
                        "../aets/"+$this.aet+"/rs/mwlitems",
                        local,
                        $this.jsonHeader
                    ).subscribe((response) => {
                        if(mode === "edit"){
                            // _.assign(mwl, mwlFiltered);
                            $this.mainservice.setMessage({
                                "title": "Info",
                                "text": "MWL saved successfully!",
                                "status": "info"
                            });
                        }else{
                            $this.mainservice.setMessage({
                                "title": "Info",
                                "text": "MWL created successfully!",
                                "status": "info"
                            });
                            $this.fireRightQuery();
                        }
                    },(response) => {
                        $this.mainservice.setMessage({
                            "title": "Error "+response.status,
                            "text": response.statusText,
                            "status": "error"
                        });
                        // $scope.callBackFree = true;
                    });
                }else{
                    console.log("no", originalMwlObject);
                    // patient = originalPatient;
                    _.assign(mwl, originalMwlObject);
                }
                $this.dialogRef = null;
            });
        },(err)=>{
            console.log("error",err);
        });
    }
    editPatient(patient, patientkey){
        this.saveLabel = "SAVE";
        this.titleLabel = "Edit patient ";
        this.titleLabel += ((_.hasIn(patient,'attrs.00100010.Value.0.Alphabetic')) ? "<b>" + patient.attrs["00100010"].Value[0]["Alphabetic"] + "</b>" : " ");
        this.titleLabel += ((_.hasIn(patient,'attrs.00100020.Value.0')) ? " with ID: <b>" + patient.attrs["00100020"].Value[0] + "</b>" : "");
        console.log("titleLabel",this.titleLabel);
        this.modifyPatient(patient, "edit", patientkey);
    };
    modifyStudy(patient, mode, patientkey, studykey, study){
        this.config.viewContainerRef = this.viewContainerRef;
        let originalStudyObject = _.cloneDeep(study);
        // console.log("patient",patient);
        // console.log("studykey",studykey);
        // console.log("study",study);
        if(mode === "edit"){
            _.forEach(study.attrs,function(value, index) {
                var checkValue = "";
                if(value.Value && value.Value.length){
                    checkValue = value.Value.join("");
                }
                if(!(value.Value && checkValue != "")){
                    delete study.attrs[index];
                }
/*                if(value.vr === "DA" && value.Value && value.Value[0]){
                    var string = value.Value[0];
                    string = string.replace(/\./g,"");
                    var yyyy = string.substring(0,4);
                    var MM = string.substring(4,6);
                    var dd = string.substring(6,8);
                    var timestampDate   = Date.parse(yyyy+"-"+MM+"-"+dd);
                    var date          = new Date(timestampDate);
                    $scope.dateplaceholder[index] = date;
                }*/
            });
        }

        this.lastPressedCode = 0;
        let $this = this;
        this.service.getStudyIod().subscribe((res)=>{
            $this.service.patientIod = res;
            let header = "Create new Study";
            if(mode === "edit"){
                if(patient.attrs["00100020"] && patient.attrs["00100020"].Value[0]){
                    header = 'Edit study of patient <span>'+patient.attrs["00100010"].Value[0]["Alphabetic"]+'</span> with ID <span>'+patient.attrs["00100020"].Value[0]+'</span>';
                }else{
                    header = 'Edit study of patient <span>'+patient.attrs["00100010"].Value[0]["Alphabetic"]+'</span>';
                }
            }
            let iod = $this.service.replaceKeyInJson(res, "items", "Value");
            let studyFiltered = _.cloneDeep(study);
            studyFiltered.attrs = new ComparewithiodPipe().transform(study.attrs,iod);
            $this.service.initEmptyValue(studyFiltered.attrs);
            console.log("afterinintemptyvalue");
            $this.dialogRef = $this.dialog.open(EditStudyComponent, $this.config);
            console.log("afterinintemptyvalue2");
            $this.dialogRef.componentInstance.study = studyFiltered;
            $this.dialogRef.componentInstance.studykey = studykey;
            $this.dialogRef.componentInstance.dropdown = $this.service.getArrayFromIod(res);
            $this.dialogRef.componentInstance.iod = iod;
            console.log("$this.savelabel",$this.saveLabel);
            $this.dialogRef.componentInstance.saveLabel = $this.saveLabel;
            $this.dialogRef.componentInstance.titleLabel = $this.titleLabel;
            $this.dialogRef.componentInstance.mode = mode;
            $this.dialogRef.afterClosed().subscribe(result => {
                if(result){
                    $this.service.clearPatientObject(studyFiltered.attrs);
                    $this.service.convertStringToNumber(studyFiltered.attrs);
                    // StudiesService.convertDateToString($scope, "editstudyFiltered");

                    //Add patient attributs again
                    // angular.extend($scope.editstudyFiltered.attrs, patient.attrs);
                    // $scope.editstudyFiltered.attrs.concat(patient.attrs);
                    var local = {};
                    $this.service.appendPatientIdTo(patient.attrs,local);
                    // local["00100020"] = patient.attrs["00100020"];
                    _.forEach(studyFiltered.attrs,function(m, i){
                        if(res[i]){
                            local[i] = m;
                        }
                    });
                    $this.$http.post(
                        "../aets/"+$this.aet+"/rs/studies",
                        local,
                        $this.jsonHeader
                    ).subscribe(
                        (response) => {
                            if(mode === "edit"){
                                // _.assign(study, studyFiltered);
                                $this.mainservice.setMessage( {
                                    "title": "Info",
                                    "text": "Study saved successfully!",
                                    "status": "info"
                                });
                            }else{
                                $this.mainservice.setMessage( {
                                    "title": "Info",
                                    "text": "Study created successfully!",
                                    "status": "info"
                                });
                                $this.fireRightQuery();
                            }
                        },
                        (response) => {
                            $this.mainservice.setMessage( {
                                "title": "Error "+response.status,
                                "text": response.statusText,
                                "status": "error"
                            });
                        }
                    );
                }else{
                    console.log("no", originalStudyObject);
                    // patient = originalPatient;
                    _.assign(study, originalStudyObject);
                }
                $this.dialogRef = null;
            });
        });
        // console.log("$scope.editstudy",$scope.editstudy);
 /*       $http.get('iod/study.iod.json',{ cache: true}).then(function (res) {
                // angular.forEach($scope.editstudy.attrs,function(m, i){
                //     if(!res.data[i] || res.data[i] === undefined){
                //         delete $scope.editstudy.attrs[i];
                //     }
                // });
                var dropdown                = StudiesService.getArrayFromIod(res);
                res.data = StudiesService.replaceKeyInJson(res.data, "items", "Value");
                $templateRequest('templates/edit_study.html').then(function(tpl) {
                    $scope.dropdown             = dropdown;
                    $scope.DCM4CHE              = DCM4CHE;
                    $scope.addPatientAttribut   = "";
                    $scope.opendropdown         = false;
                    // console.log("tpl",tpl);
                    var html                    = $compile(tpl)($scope);

                    // console.log("$scope.editstudy",$scope.editstudy);
                    // console.log("html",html);
                    var $vex = vex.dialog.open({
                        message: header,
                        input: html,
                        className:"vex-theme-os edit-patient",
                        overlayClosesOnClick: false,
                        escapeButtonCloses: false,
                        afterOpen: function($vexContent) {
                            cfpLoadingBar.complete();

                        },
                        onSubmit: function(e) {
                            //Prevent submit/close if ENTER was clicked
                            if($scope.lastPressedCode === 13){
                                e.preventDefault();
                            }else{
                                $vex.data().vex.callback();
                            }
                        },
                        buttons: [
                            $.extend({}, vex.dialog.buttons.YES, {
                                text: 'Save'
                            }), $.extend({}, vex.dialog.buttons.NO, {
                                text: 'Cancel'
                            })
                        ],
                        callback: function(data) {
                            cfpLoadingBar.start();
                            if (data === false) {
                                cfpLoadingBar.complete();

                                StudiesService.clearPatientObject($scope.editstudy.attrs);
                                return console.log('Cancelled');
                            }else{

                            }
                            vex.close($vex.data().vex.id);
                        }
                    });
                });
            },
            function errorCallback(response) {
                DeviceService.msg($scope, {
                    "title": "Error "+response.status,
                    "text": response.data.errorMessage,
                    "status": "error"
                });
                console.log("response",response);
            });*/
    };
    editStudy(patient, patientkey, studykey, study){
        this.saveLabel = "SAVE";
        this.titleLabel = "Edit study of patient ";
        this.titleLabel += ((_.hasIn(patient,'attrs.00100010.Value.0.Alphabetic')) ? "<b>" + patient.attrs["00100010"].Value[0]["Alphabetic"] + "</b>" : " ");
        this.titleLabel += ((_.hasIn(patient,'attrs.00100020.Value.0')) ? " with ID: <b>" + patient.attrs["00100020"].Value[0] + "</b>" : "");
        console.log("titleLabel",this.titleLabel);
        this.modifyStudy(patient, "edit", patientkey, studykey, study);
    };
    createStudy(patient){
        this.saveLabel = "CREATE";
        this.titleLabel = "Create new Study";
        var study = {
            "attrs":{
                "00200010": { "vr": "SH", "Value":[""]},
                "0020000D": { "vr": "UI", "Value":[""]},
                "00080050": { "vr": "SH", "Value":[""]}
            }
        };
        this.modifyStudy(patient, "create", "", "", study);
    };

    createPatient(){
        this.saveLabel = "CREATE";
        this.titleLabel = "Create new patient";
        let newPatient:any = {
            "attrs":{
                "00100010": { "vr": "PN", "Value":[{
                    Alphabetic:""
                }]},
                "00100020": { "vr": "LO", "Value":[""]},
                "00100021": { "vr": "LO", "Value":[""]},
                "00100030": { "vr": "DA", "Value":[""]},
                "00100040": { "vr": "CS", "Value":[""]}
            }
        };
        this.modifyPatient(newPatient, "create", null);
    };

    modifyPatient(patient, mode ,patientkey){
        let originalPatientObject = _.cloneDeep(patient);
        this.config.viewContainerRef = this.viewContainerRef;
        let oldPatientID;
        let oldIssuer;
        let oldUniversalEntityId;
        let oldUniversalEntityType;
        this.lastPressedCode = 0;
        if(mode === "edit"){
            _.forEach(patient.attrs,function(value, index) {
                var checkValue = "";
                if(value.Value && value.Value.length){
                    checkValue = value.Value.join("");
                }
                if(!(value.Value && checkValue != "")){
                    delete patient.attrs[index];
                }
                if(index === "00100040" && patient.attrs[index] && patient.attrs[index].Value && patient.attrs[index].Value[0]){
                    patient.attrs[index].Value[0] = patient.attrs[index].Value[0].toUpperCase();
                }
                // console.log("value.vr",value.vr);
                // console.log("value",value);
/*                if(value.vr === "DA" && value.Value && value.Value[0]){
                    var string = value.Value[0];
                    string = string.replace(/\./g,"");
                    var yyyy = string.substring(0,4);
                    var MM = string.substring(4,6);
                    var dd = string.substring(6,8);
                    var timestampDate   = Date.parse(yyyy+"-"+MM+"-"+dd);
                    var date          = new Date(timestampDate);
                    $scope.dateplaceholder[index] = date;
                }*/
            });
            if(patient.attrs["00100020"] && patient.attrs["00100020"].Value && patient.attrs["00100020"].Value[0]){
                oldPatientID            = patient.attrs["00100020"].Value[0];
            }
            if(patient.attrs["00100021"] && patient.attrs["00100021"].Value && patient.attrs["00100021"].Value[0]){
                oldIssuer               = patient.attrs["00100021"].Value[0];
            }
            if(
                patient.attrs["00100024"] &&
                patient.attrs["00100024"].Value &&
                patient.attrs["00100024"].Value[0] &&
                patient.attrs["00100024"].Value[0]["00400032"] &&
                patient.attrs["00100024"].Value[0]["00400032"].Value &&
                patient.attrs["00100024"].Value[0]["00400032"].Value[0]
            ){
                oldUniversalEntityId    = patient.attrs["00100024"].Value[0]["00400032"].Value[0];
                console.log("set oldUniversalEntityId",oldUniversalEntityId);
            }
            if(
                patient.attrs["00100024"] &&
                patient.attrs["00100024"].Value &&
                patient.attrs["00100024"].Value[0] &&
                patient.attrs["00100024"].Value[0]["00400033"] &&
                patient.attrs["00100024"].Value[0]["00400033"].Value &&
                patient.attrs["00100024"].Value[0]["00400033"].Value[0]
            ){
                oldUniversalEntityType  = patient.attrs["00100024"].Value[0]["00400033"].Value[0];
                console.log("set oldUniversalEntityType",oldUniversalEntityType);
            }
        }

        // this.config.width = "800";

        let $this = this;
        this.service.getPatientIod().subscribe((res)=>{
            $this.service.patientIod = res;

            $this.service.initEmptyValue(patient.attrs);
            $this.dialogRef = $this.dialog.open(EditPatientComponent, $this.config);
            $this.dialogRef.componentInstance.patient = patient;
            $this.dialogRef.componentInstance.patientkey = patientkey;
            $this.dialogRef.componentInstance.dropdown = $this.service.getArrayFromIod(res);
            $this.dialogRef.componentInstance.iod = $this.service.replaceKeyInJson(res, "items", "Value");
            console.log("$this.savelabel",$this.saveLabel);
            $this.dialogRef.componentInstance.saveLabel = $this.saveLabel;
            $this.dialogRef.componentInstance.titleLabel = $this.titleLabel;
            $this.dialogRef.afterClosed().subscribe(result => {
                //If user clicked save
                if(result){
                    let headers = new Headers({ 'Content-Type': 'application/json' });
                    console.log("patient for clear",patient);
                    $this.service.clearPatientObject(patient.attrs);
                    $this.service.convertStringToNumber(patient.attrs);
                    console.log("patient after clear",patient);
                    // $this.service.convertDateToString($scope, "editpatient");
                    if(patient.attrs["00100020"] && patient.attrs["00100020"].Value[0]){
                        _.forEach(patient.attrs, function(m, i){
                            if(res && res[i] && res[i].vr != "SQ" && m.Value && m.Value.length === 1 && m.Value[0] === ""){
                                delete patient.attrs[i];
                            }
                        });
                        // patient.attrs["00104000"] = { "vr": "LT", "Value":[""]};
                        oldPatientID = oldPatientID || patient.attrs["00100020"].Value[0];
                        var issuer =                oldIssuer != undefined;
                        var universalEntityId =     oldUniversalEntityId != undefined;
                        var universalEntityType =   oldUniversalEntityType != undefined;

                        if(issuer){
                            oldPatientID += "^^^"+oldIssuer;
                        }
                        if(universalEntityId || universalEntityType){
                            // if(!oldUniversalEntityId || oldUniversalEntityId === undefined){
                            //     oldUniversalEntityId    = patient.attrs["00100024"].Value[0]["00400032"].Value[0];
                            // }
                            // if(!oldUniversalEntityType || oldUniversalEntityType === undefined){
                            //     oldUniversalEntityType  = patient.attrs["00100024"].Value[0]["00400033"].Value[0];
                            // }
                            if(!issuer){
                                oldPatientID += "^^^";
                            }

                            if(universalEntityId && oldUniversalEntityId){
                                oldPatientID += "&"+ oldUniversalEntityId;
                            }
                            if(universalEntityType && oldUniversalEntityType){
                                oldPatientID += "&"+ oldUniversalEntityType;
                            }
                        }
                        // console.log("patient.attrs",patient.attrs);
                        $this.$http.put(
                            "../aets/"+$this.aet+"/rs/patients/"+oldPatientID,
                            patient.attrs
                        ).subscribe(function successCallback(response) {
                            if(mode === "edit"){
                                //Update changes on the patient list
                                // patient.attrs = patient.attrs;
                                //Force rerendering the directive attribute-list
                                // var id = "#"+patient.attrs["00100020"].Value;
                                // var attribute = $compile('<attribute-list attrs="patients['+patientkey+'].attrs"></attribute-list>')($scope);
                                // $(id).html(attribute);
                            }else{

                                $this.fireRightQuery();
                            }
                            // $scope.dateplaceholder = {};
                            // console.log("data",data);
                            // console.log("datepicker",$(".datepicker .no-close-button"));
                            $this.mainservice.setMessage( {
                                "title": "Info",
                                "text": "Patient saved successfully!",
                                "status": "info"
                            });
                        }, function errorCallback(response) {
                            $this.mainservice.setMessage( {
                                // "title": "Error",
                                // "text": "Error saving patient!",
                                // "status": "error"
                                "title": "Error "+response.status,
                                "text": response.statusText,
                                "status": "error"
                            });
                        });
                        ////
                    }else{
                        if(mode === "create"){
                                $this.$http.post(
                                    "../aets/"+$this.aet+"/rs/patients/",
                                    patient.attrs,
                                    headers
                                )
                                    //.map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
                                .subscribe(
                                (response) => {
                                    console.log("response",response);
                                    $this.mainservice.setMessage( {
                                        "title": "Info",
                                        "text": "Patient created successfully!",
                                        "status": "info"
                                    });
                                },
                                (response) => {
                                    console.log("response",response);
                                    $this.mainservice.setMessage( {
                                        "title": "Error "+response.status,
                                        "text": JSON.parse(response._body).errorMessage,
                                        "status": "error"
                                    });
                                }
                            );
                        }else{
                            $this.mainservice.setMessage( {
                                "title": "Error",
                                "text": "Patient ID is required!",
                                "status": "error"
                            });
                        }
                        // $scope.dateplaceholder = {};
                    }
                }else{
                    console.log("no", originalPatientObject);
                    // patient = originalPatient;
                    _.assign(patient, originalPatientObject);
                }
                $this.dialogRef = null;
            });
        },(err)=>{
            console.log("error",err);
        });
    };
    deletePatient(patient,patients, patientkey){
        // console.log("study",study);
        if(_.hasIn(patient,'attrs["00201200"].Value[0]') && patient.attrs['00201200'].Value[0] === 0){
            let $this = this;
            this.confirm({
                content:'Are you sure you want to delete this patient?'
            }).subscribe(result => {
                if(result){
                    $this.cfpLoadingBar.start();
                    $this.$http.delete("../aets/"+$this.aet+"/rs/patients/"+patient.attrs["00100020"].Value[0]).subscribe(
                        (response) => {
                            $this.mainservice.setMessage({
                                "title": "Info",
                                "text": "Patient deleted successfully!",
                                "status": "info"
                            });
                            console.log("patients",patients);
                            console.log("patientkey",patientkey);
                            // patients.splice(patientkey,1);
                            $this.fireRightQuery();
                            $this.cfpLoadingBar.complete();
                        },
                        (err) => {
                            $this.mainservice.setMessage({
                                "title": "Error "+err.status,
                                "text": err.statusText,
                                "status": "error"
                            });
                            // angular.element("#querypatients").trigger('click');
                            $this.cfpLoadingBar.complete();
                        }
                    );
                }
            });
        }else{
            this.mainservice.setMessage({
                "title": "Error",
                "text": "Patient not empty!",
                "status": "error"
            });
            this.cfpLoadingBar.complete();
        }
        // angular.element("#querypatients").trigger('click');
    };
    deleteMWL(mwl){

        let $this = this;
        this.confirm({
            content:'Are you sure you want to delete this MWL?'
        }).subscribe(result => {
            if(result){
                $this.cfpLoadingBar.start();
                $this.$http.delete(
                    `../aets/${this.aet}/rs/mwlitems/${mwl.attrs["0020000D"].Value[0]}/${mwl.attrs["00400100"].Value[0]["00400009"].Value[0]}`
                ).subscribe(
                    (response) => {
                        $this.mainservice.setMessage({
                            "title": "Info",
                            "text": "MWL deleted successfully!",
                            "status": "info"
                        });
                        $this.fireRightQuery();
                        $this.cfpLoadingBar.complete();
                    },
                    (response) => {
                        $this.mainservice.setMessage({
                            "title": "Error "+response.status,
                            "text": response.statusText,
                            "status": "error"
                        });
                        console.log("response",response);

                        $this.cfpLoadingBar.complete();
                    }
                );
            }
        });
    };
    keyDownOnHeader(event){
        if(event.keyCode == 13) {
            this.fireRightQuery();
        }
    }
    queryMWL(offset){
        this.queryMode = "queryMWL";
        this.moreStudies = undefined;
        this.morePatients = undefined;
        if (offset < 0 || offset === undefined) offset = 0;
        this.cfpLoadingBar.start();
        let $this = this;
        this.service.queryMwl(
            this.rsURL(),
            this.createQueryParams(offset, this.limit+1, this.createStudyFilterParams())
        ).subscribe((res) => {
                $this.patients = [];
                //           $this.studies = [];
                $this.morePatients = undefined;
                $this.moreMWL = undefined;
                if(_.size(res) > 0){
                    var pat, mwl, patAttrs, tags = $this.attributeFilters.Patient.dcmTag;
                    res.forEach(function (studyAttrs, index) {
                        patAttrs = {};
                        $this.extractAttrs(studyAttrs, tags, patAttrs);
                        if (!(pat && _.isEqual(pat.attrs, patAttrs))) {
                            pat = {
                                attrs: patAttrs,
                                mwls: [],
                                showmwls:true,
                                showAttributes: false
                            };
                            // $this.$apply(function () {
                            $this.patients.push(pat);
                            // $this.mwl.push(pat);
                            // });
                        }
                        mwl = {
                            patient: pat,
                            offset: offset + index,
                            moreSeries: false,
                            attrs: studyAttrs,
                            series: null,
                            showAttributes: false,
                            fromAllStudies:false
                        };
                        pat.mwls.push(mwl);
                    });
                    $this.extendedFilter(false);
                    if ($this.moreMWL = (res.length > $this.limit)) {
                        pat.mwls.pop();
                        if (pat.mwls.length === 0)
                            $this.patients.pop();
                        // $this.studies.pop();
                    }
                } else {
                    this.mainservice.setMessage({
                        "title": "Info",
                        "text": "No matching Modality Worklist Entries found!",
                        "status": "info"
                    });
                }
                // console.log("$this.patients",$this.patients);
                $this.cfpLoadingBar.complete();
            },
            (err) => {
                this.mainservice.setMessage({
                    "title": "Error",
                    "text": "Error saving study!",
                    "status": "error"
                });
            }
        );
    };
    setTrash(){
        this.aet = this.aetmodel.title;
        if(this.aetmodel.dcmHideNotRejectedInstances === true){
            if(this.rjcode === null){
                this.$http.get("../reject?dcmRevokeRejection=true")
                    .map((res)=>res.json())
                    .subscribe(function (res) {
                        this.rjcode = res[0];
                    });
            }
            this.filter.returnempty = false;
            this.trashaktive = true;
        }else{
            this.trashaktive = false;
        }
        this.fireRightQuery();
    };
    fireQueryOnChange(order){
        console.log("order2",order);
        switch(order.mode) {
            case "patient":
                console.log("in patientcase",this);
                this.patientmode = true;
                this.queryPatients(0);
                break;
            case "study":
                this.patientmode = false;
                this.queryStudies(0);
                break;
            case "mwl":
                this.patientmode = false;
                this.queryMWL(0)
                break;
        }
    }
    fireRightQuery(){
        console.log("querymode=",this.queryMode);
        this[this.queryMode](0);
    }
    querySeries = function(study, offset) {
        console.log("in query sersies study=",study);
        this.cfpLoadingBar.start();
        if (offset < 0) offset = 0;
        let $this = this;
        this.service.querySeries(
            this.rsURL(),
            study.attrs['0020000D'].Value[0],
            this.createQueryParams(offset, this.limit+1, { orderby: 'SeriesNumber'})
        ).subscribe(function (res) {
            if(res){
                if(res.length === 0){
                    this.mainservice.setMessage( {
                        "title": "Info",
                        "text": "No matching series found!",
                        "status": "info"
                    });
                    console.log("in reslength 0");
                }else{

                    study.series = res.map(function (attrs, index) {
                        return {
                            study: study,
                            offset: offset + index,
                            moreInstances: false,
                            attrs: attrs,
                            instances: null,
                            showAttributes: false,
                            selected:false
                        };
                    });
                    if (study.moreSeries = (study.series.length > $this.limit)) {
                        study.series.pop();
                    }
                    // StudiesService.trim(this);
                }
                $this.cfpLoadingBar.complete();
            }else{
                this.mainservice.setMessage( {
                    "title": "Info",
                    "text": "No matching series found!",
                    "status": "info"
                });
            }
        });
    };

    queryInstances = function (series, offset) {
        this.cfpLoadingBar.start();
        if (offset < 0) offset = 0;
        let $this = this;
        this.service.queryInstances(
            this.rsURL(),
            series.attrs['0020000D'].Value[0],
            series.attrs['0020000E'].Value[0],
            this.createQueryParams(offset, this.limit+1, { orderby: 'InstanceNumber'})
        ).subscribe(function (res) {
                if(res){
                    series.instances = res.map(function(attrs, index) {
                        var numberOfFrames = $this.valueOf(attrs['00280008']),
                            gspsQueryParams = $this.createGSPSQueryParams(attrs),
                            video = $this.isVideo(attrs);
                        $this.cfpLoadingBar.complete();
                        return {
                            series: series,
                            offset: offset + index,
                            attrs: attrs,
                            showAttributes: false,
                            showFileAttributes:false,
                            wadoQueryParams: {
                                studyUID: attrs['0020000D'].Value[0],
                                seriesUID: attrs['0020000E'].Value[0],
                                objectUID: attrs['00080018'].Value[0]
                            },
                            video: video,
                            numberOfFrames: numberOfFrames,
                            gspsQueryParams: gspsQueryParams,
                            views: $this.createArray(video || numberOfFrames || gspsQueryParams.length || 1),
                            view: 1,
                            selected:false
                        };
                    });
                }else{
                    series.instances = {};
                }
                if (series.moreInstances = (series.instances.length > $this.limit)) {
                    series.instances.pop();
                }
                // StudiesService.trim(this);
                $this.cfpLoadingBar.complete();
            });
    };
    queryAllStudiesOfPatient = function(patient, offset, event) {
        console.log("in queryallstudies");
        event.preventDefault();
        this.cfpLoadingBar.start();
        if (offset < 0) offset = 0;
        let $this = this;
        this.service.queryStudies(
            this.rsURL(),
            this.createQueryParams(offset, this.limit+1, {
                PatientID: this.valueOf(patient.attrs['00100020']),
                IssuerOfPatientID: this.valueOf(patient.attrs['00100021']),
                orderby: this.filter.orderby !== "StudyDate,StudyTime" ? "-StudyDate,-StudyTime" : this.filter.orderby
            })
        )
            .subscribe((res) => {
            console.log("res in queryallstudy",res);
            if(res && res.length > 0){
                patient.studies = res.map(function (attrs, index) {
                    return {
                        patient: patient,
                        offset: offset + index,
                        moreSeries: false,
                        attrs: attrs,
                        series: null,
                        showAttributes: false,
                        fromAllStudies:true,
                        selected:false
                    };
                });
                if (patient.moreStudies = (patient.studies.length > $this.limit)) {
                    patient.studies.pop();
                }
                // StudiesService.trim($this);
                // console.log("patient",patient);
            }else{
                this.mainservice.setMessage( {
                    "title": "Info",
                    "text": "No matching Studies found!",
                    "status": "info"
                });
            }
            this.cfpLoadingBar.complete();
        });
    };
    queryPatients = function(offset){
        this.queryMode = "queryPatients";
        this.moreStudies = undefined;
        this.moreMWL = undefined;
        this.cfpLoadingBar.start();
        let $this = this;
        if (offset < 0) offset = 0;
        this.service.queryPatients(
            this.rsURL(),
            this.createQueryParams(offset, this.limit+1, this.createPatientFilterParams())
        ).subscribe((res) => {
            $this.morePatients = undefined;
            $this.moreStudies = undefined;
            if(_.size(res) > 0){
                $this.patients = res.map(function (attrs, index) {
                    return {
                        moreStudies: false,
                        offset: offset + index,
                        attrs: attrs,
                        studies: null,
                        showAttributes: false,
                        selected:false
                    };
                });
                if ($this.morePatients = ($this.patients.length > $this.limit)) {
                    $this.patients.pop();
                }
            } else {
                $this.patients = [];
                // this.mainservice.setMessage( {
                //     "title": "Info",
                //     "text": "No matching Patients found!",
                //     "status": "info"
                // });
            }
            $this.extendedFilter(false);
            // var state = ($this.allhidden) ? "hide" : "show";
            // setTimeout(function(){
            //     togglePatientsHelper(state);
            // }, 1000);
            $this.cfpLoadingBar.complete();
        });
    };

    toggleAttributs(instance,art){
        if(art==="fileattributs"){
            instance.showAttributes = false;
            instance.showFileAttributes = !instance.showFileAttributes;
        }else{
            instance.showAttributes = !instance.showAttributes;
            instance.showFileAttributes = false;
        }
    };
    // addFileAttribute(instance){
    //     // var id      = '#file-attribute-list-'+(instance.attrs['00080018'].Value[0]).replace(/\./g, '');
    //     // if($(id).find("*").length < 1){
    //     //     this.cfpLoadingBar.start();
    //     //     var html    = '<file-attribute-list [studyuid]="'+ instance.wadoQueryParams.studyUID +'" [seriesuid]="'+ instance.wadoQueryParams.seriesUID +'"  [objectuid]="'+ instance.wadoQueryParams.objectUID+ '" [aet]="'+this.aet+'" ></file-attribute-list>';
    //     //     // console.log("html=",html);
    //     //     // cfpLoadingBar.set(cfpLoadingBar.status()+(0.2));
    //     //     $(id).html(html);
    //     //     this.cfpLoadingBar.complete();
    //     // }
    //     if(!instance.showFileAttributes || instance.showFileAttributes === false){
    //         instance.showFileAttributes = true;
    //     }else{
    //         instance.showFileAttributes = false;
    //     }
    // };
    downloadURL(inst, transferSyntax) {
        var exQueryParams = { contentType: 'application/dicom', transferSyntax:""};
        if (transferSyntax)
            exQueryParams.transferSyntax = transferSyntax;
        return this.wadoURL(inst.wadoQueryParams, exQueryParams);
    };
    viewInstance(inst) {
        window.open(this.renderURL(inst));
    };
    select(object, modus, keys, fromcheckbox){
        console.log("in select = fromcheckbox", fromcheckbox);
        // let test = true;
        console.log("object",object);
        console.log("object.selected",object.selected);
        // console.log("patient object selected",this.patients[keys.patientkey].studies[keys.studykey].selected);
        console.log("object",object);
        console.log("modus",modus);
        console.log("keys",keys);
        let clickFromCheckbox = (fromcheckbox && fromcheckbox === "fromcheckbox");
        if(this.isRole("admin")){
            this.anySelected = true;
            this.lastSelectedObject = object;
            this.lastSelectedObject.modus = modus;
            /*
            * If the function was called from checkbox go in there
            * */
            if(clickFromCheckbox){
                console.log("in if fromcheckbox", fromcheckbox);
                this.selectObject(object, modus, true);
            }

            console.log("in ctrlclick keysdown",this.keysdown);
            console.log("Object.keys(this.keysdown).length",Object.keys(this.keysdown).length);
            //ctrl + click
            if(this.keysdown && Object.keys(this.keysdown).length === 1 && (this.keysdown[17]===true || this.keysdown[91]===true || this.keysdown[93]===true || this.keysdown[224]===true)){
                this.selectObject(object, modus, false);
            }
            // //close contextmenu (That's a bug on contextmenu module. The bug has been reported)
            // $(".dropdown.contextmenu").addClass('ng-hide');

            //Shift + click
            console.log("before shiftclick");
            if(this.keysdown && Object.keys(this.keysdown).length === 1 && this.keysdown[16] === true){
                console.log("in shift click");
                this.service.clearSelection(this.patients);
                if(!this.lastSelect){
                    this.selectObject(object, modus, false);
                    this.lastSelect = {"keys":keys, "modus":modus};
                }else{
                    if(modus != this.lastSelect.modus){
                        this.service.clearSelection(this.patients);
                        this.selectObject(object, modus, false);
                        this.lastSelect = {"keys":keys, "modus":modus};
                    }else{
                        switch(modus) {
                            case "patient":
                                this.selectObject(object, modus, false);
                                break;
                            case "study":
                                // {"patientkey":patientkey,"studykey":studykey}
                                if(keys.patientkey != this.lastSelect.keys.patientkey){
                                    this.service.clearSelection(this.patients);
                                    this.selectObject(object, modus, false);
                                    this.lastSelect = {"keys":keys, "modus":modus};
                                }else{
                                    console.log("keys.studykey",keys.studykey);
                                    console.log("this.lastSelect.keys.studykey",this.lastSelect.keys.studykey);
                                    if(keys.studykey > this.lastSelect.keys.studykey){
                                        for (var i = keys.studykey; i >= this.lastSelect.keys.studykey; i--) {
                                            console.log("i",i);
                                            console.log("this.patients[keys.patientkey].studies[i]=",this.patients[keys.patientkey].studies[i]);
                                            // this.patients[keys.patientkey].studies[i].selected = true;
                                            this.selectObject(this.patients[keys.patientkey].studies[i], modus, false);
                                        }
                                    }else{
                                        for (var i = this.lastSelect.keys.studykey; i >= keys.studykey; i--) {
                                            console.log("this.patients[keys.patientkey].studies[i]=",this.patients[keys.patientkey].studies[i]);
                                            // this.patients[keys.patientkey].studies[i].selected = true;
                                            this.selectObject(this.patients[keys.patientkey].studies[i], modus, false);
                                        }
                                    }
                                    this.lastSelect = {};
                                }
                                break;
                            case "series":
                                console.log("series");
                                console.log("keys",keys);
                                if(keys.patientkey != this.lastSelect.keys.patientkey || keys.studykey != this.lastSelect.keys.studykey){
                                    this.service.clearSelection(this.patients);
                                    this.selectObject(object, modus, false);
                                    this.lastSelect = {"keys":keys, "modus":modus};
                                }else{
                                    console.log("keys.studykey",keys.serieskey);
                                    console.log("this.lastSelect.keys.studykey",this.lastSelect.keys.serieskey);
                                    if(keys.serieskey > this.lastSelect.keys.serieskey){
                                        for (var i = keys.serieskey; i >= this.lastSelect.keys.serieskey; i--) {
                                            console.log("i",i);
                                            console.log("this.patients[keys.patientkey].studies[i]=",this.patients[keys.patientkey].studies[keys.studykey].series[i]);
                                            // this.patients[keys.patientkey].studies[i].selected = true;
                                            this.selectObject(this.patients[keys.patientkey].studies[keys.studykey].series[i], modus, false);
                                        }
                                    }else{
                                        for (var i = this.lastSelect.keys.serieskey; i >= keys.serieskey; i--) {
                                            console.log("this.patients[keys.patientkey].studies[i]=",this.patients[keys.patientkey].studies[keys.studykey].series[i]);
                                            // this.patients[keys.patientkey].studies[i].selected = true;
                                            this.selectObject(this.patients[keys.patientkey].studies[keys.studykey].series[i], modus, false);
                                        }
                                    }
                                    this.lastSelect = {};
                                }
                                break;
                            case "instance":
                                console.log("series");
                                console.log("keys",keys);
                                console.log("this.patients",this.patients[keys.patientkey]);
                                if(keys.patientkey != this.lastSelect.keys.patientkey || keys.studykey != this.lastSelect.keys.studykey || keys.serieskey != this.lastSelect.keys.serieskey){
                                    this.service.clearSelection(this.patients);
                                    this.selectObject(object, modus, false);
                                    this.lastSelect = {"keys":keys, "modus":modus};
                                }else{
                                    console.log("keys.studykey",keys.instancekey);
                                    console.log("this.lastSelect.keys.studykey",this.lastSelect.keys.instancekey);
                                    if(keys.instancekey > this.lastSelect.keys.instancekey){
                                        for (let i = keys.instancekey; i >= this.lastSelect.keys.instancekey; i--) {
                                            console.log("i",i);
                                            // console.log("this.patients[keys.patientkey].studies[i]=",this.patients[keys.patientkey].studies[keys.studykey].series[keys.studykey].instances[i]);
                                            // this.patients[keys.patientkey].studies[i].selected = true;
                                            this.selectObject(this.patients[keys.patientkey].studies[keys.studykey].series[keys.serieskey].instances[i], modus, false);
                                        }
                                    }else{
                                        for (let i = this.lastSelect.keys.instancekey; i >= keys.instancekey; i--) {
                                            // console.log("this.patients[keys.patientkey].studies[keys.studykey].series[keys.studykey].instances[i]=",this.patients[keys.patientkey].studies[keys.studykey].series[keys.studykey].instances[i]);
                                            // this.patients[keys.patientkey].studies[i].selected = true;
                                            this.selectObject(this.patients[keys.patientkey].studies[keys.studykey].series[keys.serieskey].instances[i], modus, false);
                                        }
                                    }
                                    this.lastSelect = {};
                                }
                                break;
                            default:
                            //
                        }
                    }
                }
            }
            console.log("before keyend");
            if(!this.showCheckboxes && !clickFromCheckbox && this.keysdown && Object.keys(this.keysdown).length === 0 && this.anySelected){
                this.service.clearSelection(this.patients);
                this.anySelected = false;
                this.selected = {};
                // this.selected['otherObjects'] = {};
            }
            if(modus === 'patient'){
                console.log("this.selected",this.selected);//TODO when you have have a patient list, on ctrl and click the haspatient is still false
                //console.log("this.selectedkeys",Object.keys(this.selected.patients).length);
                //console.log("patient.length",_.size(this.selected.patients));
                if(_.size(this.selected.patients) > 0){
                    this.selected.hasPatient = true;
                }else{
                    this.selected.hasPatient = false;
                }
            }
            try {
                this.clipboardHasScrollbar = $("#clipboard_content").get(0).scrollHeight > $("#clipboard_content").height();
            }catch (e){

            }
        }
    };
    // clipboardHasScrollbar(){
    //     // $.fn.hasScrollBar = function() {
    //     //     return this.get(0).scrollHeight > this.height();
    //     // }
    //     return
    // }
    selectObject(object, modus, fromcheckbox){
        console.log("in select object modus", modus);
        console.log("object",object);
        console.log("object selected",object.selected);
        console.log("this.clipboard.action",this.clipboard.action);
        this.showClipboardHeaders[modus] = true;
        // if(!fromcheckbox){
            object.selected = !object.selected;
        // }
        this.target = object;
        this.target.modus = modus;
        console.log("2object selected",object.selected);
        // this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["modus"] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["modus"] || modus;
        // console.log("",);
        if(object.selected && object.selected === true){
            this.selected['otherObjects'] = this.selected['otherObjects'] || {};
            if(modus === "patient"){
/*                if(!_.isset(object.attrs["00100020"].Value[0])){

                }*/
                console.log("issettestid =",_.hasIn(object, 'attrs["00100020"].Value[0]'));
                console.log("issuerhasin =",_.hasIn(object,'attrs["00100021"].Value[0]'));
                console.log("modus in selectObject patient");
                this.selected["patients"] = this.selected['patients'] || [];
                let patientobject = {};
                patientobject["PatientID"] = object.attrs["00100020"].Value[0];
                // if(object.attrs["00100021"] && object.attrs["00100021"].Value && object.attrs["00100021"].Value[0]){
                if(_.hasIn(object,'attrs["00100021"].Value[0]') && object.attrs["00100021"].Value[0] != ''){
                    patientobject["IssuerOfPatientID"] = object.attrs["00100021"].Value[0];
                }
                // if((object.attrs["00100024"] && object.attrs["00100024"].Value[0]['00400032'] && object.attrs["00100024"].Value[0]['00400032'].Value[0]) && (object.attrs["00100024"] && object.attrs["00100024"].Value[0]['00400033'] && object.attrs["00100024"].Value[0]['00400033'].Value[0])){
                if(_.hasIn(object, 'attrs.00100024.Value[0].00400032.Value[0]') && _.hasIn(object, 'attrs.00100024.Value[0].00400033.Value[0]') && (object.attrs['00100024'].Value[0]['00400032'].Value[0] != '') && (object.attrs['00100024'].Value[0]['00400033'].Value[0] != '')){
                    patientobject['IssuerOfPatientIDQualifiers'] = {
                        "UniversalEntityID": object.attrs["00100024"].Value[0]['00400032'].Value[0],
                        "UniversalEntityIDType": object.attrs["00100024"].Value[0]['00400033'].Value[0]
                    };
                }
                // console.log("check if patient in select selected =",this.service.getPatientId(this.selected.patients));
                let patientInSelectedObject = false;
                _.forEach(this.selected.patients, (m,i)=>{
                    console.log("i=",i);
                    console.log("m=",m);
                    console.log("patientid",this.service.getPatientId(m));
                    if(this.service.getPatientId(m) === this.service.getPatientId(patientobject)){
                        patientInSelectedObject = true;
                    }
                });
                console.log("patientobject =",this.service.getPatientId(patientobject));
                if(!patientInSelectedObject){
                    this.selected['patients'].push(patientobject);
                }
/*                this.selected['patients'].push({
                    "PatientID": object.attrs["00100020"].Value[0],
                    "IssuerOfPatientID": ((object.attrs["00100021"] && object.attrs["00100021"].Value && object.attrs["00100021"].Value[0]) ? object.attrs["00100021"].Value[0]:''),
                    "IssuerOfPatientIDQualifiers": {
                        "UniversalEntityID": ((object.attrs["00100024"] && object.attrs["00100024"].Value[0]['00400032'] && object.attrs["00100024"].Value[0]['00400032'].Value[0]) ? object.attrs["00100024"].Value[0]['00400032'].Value[0] : ''),
                        "UniversalEntityIDType": ((object.attrs["00100024"] && object.attrs["00100024"].Value[0]['00400033'] && object.attrs["00100024"].Value[0]['00400033'].Value[0]) ? object.attrs["00100024"].Value[0]['00400033'].Value[0] : '')
                    }
                });*/

                this.selected['otherObjects'][object.attrs["00100020"].Value[0]] = this.selected['otherObjects'][object.attrs["00100020"].Value[0]] || {};
                this.selected['otherObjects'][object.attrs["00100020"].Value[0]] = patientobject;
            }else{
                this.selected['otherObjects'][object.attrs["0020000D"].Value[0]] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]] || {};
                this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["StudyInstanceUID"] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["StudyInstanceUID"] || object.attrs["0020000D"].Value[0];
            }
            if(modus === "study"){
                _.forEach(object.series, (m,k)=>{
                    m.selected = object.selected;
                    _.forEach(m.instances, (j,i) => {
                        j.selected = object.selected;
                    });
                });
            }
            if(modus === "series"){
                _.forEach(object.instances, function(j,i){
                    j.selected = object.selected;
                });
                this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"] || [];
                let SeriesInstanceUIDInArray = false;
                if(this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"]){
                    _.forEach(this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"], function(s,l){
                        console.log("s",s);
                        console.log("l",l);
                        if(s.SeriesInstanceUID === object.attrs["0020000E"].Value[0]){
                            SeriesInstanceUIDInArray = true;
                        }
                    });
                }else{
                    SeriesInstanceUIDInArray = false;
                }
                if(!SeriesInstanceUIDInArray){
                    this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"].push({
                        "SeriesInstanceUID": object.attrs["0020000E"].Value[0]
                    });
                }
            }
            if(modus === "instance"){

                this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"] || [];
                let SeriesInstanceUIDInArray = false;
                if(this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"]){

                    _.forEach(this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"], function(s,l){
                        if(s.SeriesInstanceUID === object.attrs["0020000E"].Value[0]){
                            SeriesInstanceUIDInArray = true;
                        }
                    });
                }else{
                    SeriesInstanceUIDInArray = false;
                }
                if(!SeriesInstanceUIDInArray){
                    this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"].push({
                        "SeriesInstanceUID": object.attrs["0020000E"].Value[0]
                    });
                }
                let $this = this;
                _.forEach($this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"],function(m,i){
                    if(m.SeriesInstanceUID === object.attrs["0020000E"].Value[0]){

                        $this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"][i]["ReferencedSOPSequence"] = $this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"][i]["ReferencedSOPSequence"] || [];

                        let sopClassInstanceUIDInArray = false;
                        _.forEach($this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"][i]["ReferencedSOPSequence"],function(m2, i2){
                            if(m2.ReferencedSOPClassUID && m2.ReferencedSOPClassUID === object.attrs["00080016"].Value[0] && m2.ReferencedSOPInstanceUID && m2.ReferencedSOPInstanceUID === object.attrs["00080018"].Value[0]){
                                sopClassInstanceUIDInArray = true;
                            }
                        });
                        if(!sopClassInstanceUIDInArray){
                            $this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["ReferencedSeriesSequence"][i]["ReferencedSOPSequence"].push(                                                                                                                    {
                                "ReferencedSOPClassUID": object.attrs["00080016"].Value[0],
                                "ReferencedSOPInstanceUID": object.attrs["00080018"].Value[0]
                            });
                        }
                    }
                });
            }
        }else{
            if(modus === "patient"){
                console.log("modus in selectObject patient",this.selected['otherObjects']);
                // if(this.clipboard.action === 'merge'){
/*                this.selected['otherObjects']["patients"] = this.selected['patients'] || [];
                this.selected['patients'].push({
                    "PatientID": object.attrs["00100020"].Value[0],
                    "IssuerOfPatientID": ((object.attrs["00100020"]) ? object.attrs["00100020"].Value[0]:''),
                    "IssuerOfPatientIDQualifiers": {
                        "UniversalEntityID": ((object.attrs["00100024"] && object.attrs["00100024"].Value[0]['00400032'] && object.attrs["00100024"].Value[0]['00400032'].Value[0]) ? object.attrs["00100024"].Value[0]['00400032'].Value[0] : ''),
                        "UniversalEntityIDType": ((object.attrs["00100024"] && object.attrs["00100024"].Value[0]['00400033'] && object.attrs["00100024"].Value[0]['00400033'].Value[0]) ? object.attrs["00100024"].Value[0]['00400033'].Value[0] : '')
                    }
                });*/
                let $this = this;
                _.forEach(this.selected['patients'],(m,i)=>{
                    console.log("m",m);
                    // console.log("ifcheck,mpatientid",m.PatientID);
                    // console.log("ifcheck,objectpid",object.attrs["00100020"].Value[0]);
                    if(m && m.PatientID === object.attrs["00100020"].Value[0]){
                        console.log("in if",$this.selected['patients'][i]);
                       this.selected['patients'].splice(i,1);
                        console.log("in if",$this.selected['otherObjects'])
                    }
                    console.log("i",i);
                });
                delete this.selected['otherObjects'][object.attrs["00100020"].Value[0]];
                // this.selected['otherObjects'][object.attrs["00100020"].Value[0]] = this.selected['otherObjects'][object.attrs["00100020"].Value[0]] || {};
                // }else{
                // }
            }else{
                console.log("in else",modus);
                delete this.selected['otherObjects'][object.attrs["0020000D"].Value[0]];
/*                this.selected['otherObjects'][object.attrs["0020000D"].Value[0]] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]] || {};
                this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["StudyInstanceUID"] = this.selected['otherObjects'][object.attrs["0020000D"].Value[0]]["StudyInstanceUID"] || object.attrs["0020000D"].Value[0];*/
            }
        }
        // this.selected['otherObjects'][modus] = this.selected['otherObjects'][modus] || [];
        // this.selected['otherObjects'][modus].push(object);
        console.log("this.selected['otherObjects']",this.selected['otherObjects']);
    }
    rsURL() {
        return "../aets/" + this.aet + "/rs";
    }
    studyURL(attrs) {
        return this.rsURL() + "/studies/" + attrs['0020000D'].Value[0];
    }
    seriesURL(attrs) {
        return this.studyURL(attrs) + "/series/" + attrs['0020000E'].Value[0];
    }
    instanceURL(attrs) {
        return this.seriesURL(attrs) + "/instances/" + attrs['00080018'].Value[0];
    }
    createPatientFilterParams() {
        let filter = Object.assign({}, this.filter);//?? angular.extend to Object.assign whe have to test if it works like in angular1
        console.log("filter",filter);
        return filter;
    }
    createStudyFilterParams() {
        let filter = Object.assign({}, this.filter); //?? angular.extend to Object.assign whe have to test if it works like in angular1
        this.appendFilter(filter, "StudyDate", this.studyDate, /-/g);
        this.appendFilter(filter, "ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate", this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate, /-/g);
        this.appendFilter(filter, "StudyTime", this.studyTime, /:/g);
        this.appendFilter(filter, "ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime", this.ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime, /-/g);
        return filter;
    }

    appendFilter(filter, key, range, regex) {
        let value = range.from.replace(regex, '');
        if (range.to !== range.from)
            value += '-' + range.to.replace(regex, '');
        if (value.length)
            filter[key] = value;
    }

    createQueryParams(offset, limit, filter) {
        let params = {
            includefield: 'all',
            offset: offset,
            limit: limit
        };
        for(let key in filter){
            if (filter[key] || filter===false){
                params[key] = filter[key];
            }
        }
        // for(let key = 0;key < filter.length ; key++){
        //     console.log("params=",params,"key=",key, "paramskey",params[key]);
        //     if (filter[key] || filter===false){
        //         params[key] = filter[key];
        //     }
        // }
        return params;
    }
    showClipboardForAMoment(){
        this.showClipboardContent = true;
        let $this = this;
        setTimeout(function() {
            $this.showClipboardContent = false;
        }, 1500);
    };
    ctrlX(){
        if(this.isRole("admin")){
            console.log("ctrl x");
            if(_.size(this.selected['otherObjects']) > 0){
                if(this.selected.hasPatient === true){
                    this.mainservice.setMessage({
                        "title": "Info",
                        "text": "Move process on patient level is not supported",
                        "status":'info'
                    });
                }else{
                    this.service.MergeRecursive(this.clipboard,this.selected);
                    if(this.clipboard.action && this.clipboard.action === "copy"){
                        let $this = this;
                        this.confirm({
                            content:'Are you sure you want to change the action from copy to move?'
                        }).subscribe(result => {
                            if(result){
                                $this.clipboard["action"] = "move";
                            }
                            $this.showClipboardForAMoment();
                        });
                    }else{
                        this.clipboard["action"] = "move";
                        this.showClipboardForAMoment();
                    }
                    this.service.clearSelection(this.patients);
                    this.selected = {};
                    // this.showClipboardContent = true;

                }
            }
        }
    };
    merge(){
        if(this.isRole("admin")){
            if(_.size(this.selected['patients']) > 0){
                console.log("merge",this.clipboard);
                this.clipboard = this.clipboard || {};
                console.log("this.selected['otherObjects']",this.selected['otherObjects']);
                // console.log("test",angular.merge({},this.clipboard.selected, this.selected['otherObjects']));
                // this.clipboard.selected = angular.merge({},this.clipboard.selected, this.selected['otherObjects']);
                this.service.MergeRecursive(this.clipboard,this.selected);
                if(this.clipboard.action && (this.clipboard.action === "move" || this.clipboard.action === "copy")){
                    let $this = this;
                    this.confirm({
                        content:'Are you sure you want to change the action from '+this.clipboard.action+' to merge?'
                    }).subscribe(result => {
                        if(result){
                            $this.clipboard["action"] = "merge";
                        }
                        $this.showClipboardForAMoment();
                    });
                }else{
                    this.clipboard["action"] = "merge";
                    this.showClipboardForAMoment();
                }
                console.log("this.clipboard",this.clipboard);
                this.service.clearSelection(this.patients);

                this.selected = {};
                // this.showClipboardContent = true;
            }
/*            else{
                this.mainservice.setMessage({
                    "title": "Info",
                    "text": "No element selected!",
                    "status":'info'
                });
            }*/
        }
    };
    ctrlC(){
        if(this.isRole("admin")){
            if(_.size(this.selected['otherObjects']) > 0){
                if(this.selected.hasPatient === true){
                    this.mainservice.setMessage({
                        "title": "Info",
                        "text": "Copy process on patient level is not supported",
                        "status":'info'
                    });
                }else{
                    console.log("ctrl c",this.clipboard);

                    this.clipboard = this.clipboard || {};
                    console.log("this.selected['otherObjects']",this.selected['otherObjects']);
                    // console.log("test",angular.merge({},this.clipboard.selected, this.selected['otherObjects']));
                    // this.clipboard.selected = angular.merge({},this.clipboard.selected, this.selected['otherObjects']);
                    // delete this.selected['otherObjects'].patients;
                    console.log("this.selected['otherObjects']",this.selected['otherObjects']);
                    this.service.MergeRecursive(this.clipboard,this.selected);
                    console.log("this.clipboard",this.clipboard);
                    if(this.clipboard.action && this.clipboard.action === "move"){
                        let $this = this;
                        this.confirm({
                            content:'Are you sure you want to change the action from move to copy?'
                        }).subscribe(result => {
                            if(result){
                                $this.clipboard["action"] = "copy";
                            }
                            $this.showClipboardForAMoment();
                        });
                    }else{
                        this.clipboard["action"] = "copy";
                        this.showClipboardForAMoment();
                    }
                    console.log("this.clipboard",this.clipboard);
                    this.service.clearSelection(this.patients);
                    this.selected = {};
                    // this.showClipboardContent = true;
                }
            }
/*            else{
                this.mainservice.setMessage({
                    "title": "Info",
                    "text": "No element selected!",
                    "status":'info'
                });
            }*/
        }
    };
    ctrlV() {
        if (_.size(this.clipboard) > 0) {
            this.cfpLoadingBar.start();
            let headers:Headers = new Headers({'Content-Type': 'application/json'});
            headers.append("testparam","testvalue");
            console.log("headers",headers);


            if(!this.service.isTargetInClipboard(this.selected, this.clipboard)){//TODO

                let $this = this;
                console.log("target", this.target);
                console.log("firstelement select3", _.keysIn(this.selected.otherObjects)[0]);
                console.log("selection in clipboard", ((_.keysIn(this.selected.otherObjects)[0]) in this.clipboard.otherObjects));
                // if (((_.keysIn(this.selected.otherObjects)[0]) in this.clipboard.otherObjects)) {
                //     this.mainservice.setMessage({
                //         "title": "Warning",
                //         "text": "Target object cannot be in the clipboard!",
                //         "status":'warning'
                //     });
                // } else {

                    this.config.viewContainerRef = this.viewContainerRef;
                    this.dialogRef = this.dialog.open(CopyMoveObjectsComponent, this.config);
                    let action = this.clipboard["action"].toUpperCase();
                    this.dialogRef.componentInstance.clipboard = this.clipboard;
                    this.dialogRef.componentInstance.rjnotes = this.rjnotes;
                    this.dialogRef.componentInstance.selected = this.selected['otherObjects'];
                    this.dialogRef.componentInstance.showClipboardHeaders = this.showClipboardHeaders;
                    this.dialogRef.componentInstance.target = this.target;
                    this.dialogRef.componentInstance.saveLabel = action;
                    this.dialogRef.componentInstance.title = action + ' PROCESS';
                    this.cfpLoadingBar.stop();
                    this.dialogRef.afterClosed().subscribe(result => {
                        $this.cfpLoadingBar.start();
                        if (result) {
                            if ($this.clipboard.action === "merge") {
                                let object = {
                                    priorPatientID: $this.clipboard.patients
                                }
                                console.log("object", object);
                                console.log("in merge clipboard", $this.clipboard);
                                console.log("in merge selected", $this.selected['otherObjects']);
                                console.log("in merge selected", $this.selected.patients[0].PatientID);
                                console.log("getpatientid",$this.service.getPatientId($this.selected.patients));
                                $this.$http.post(
                                    "../aets/" + $this.aet + "/rs/patients/" + $this.service.getPatientId($this.selected.patients) + "/merge",
                                    object.priorPatientID,
                                    headers
                                )
                                    .subscribe((response)=> {
                                        console.log("response in first", response.status);
                                        if(response.status === 204){
                                            $this.mainservice.setMessage({
                                                "title": "Info",
                                                "text": "Patients merged successfully!",
                                                "status": "info"
                                            });
                                        }else{
                                            $this.mainservice.setMessage({
                                                "title": "Info",
                                                "text": response.statusText,
                                                "status": "info"
                                            });
                                        }
                                        $this.selected = {};
                                        $this.clipboard = {};
                                        $this.fireRightQuery();
                                        $this.cfpLoadingBar.stop();
                                    }, (response)=> {
                                        $this.cfpLoadingBar.stop();
                                        try{

                                            if (response._body && response._body != '') {
                                                try{
                                                    console.log("responseb1", JSON.parse(response._body).errorMessage);
                                                    console.log("responseb2", response.body);

                                                    $this.mainservice.setMessage({
                                                        "title": "Error " + response.status,
                                                        "text": JSON.parse(response._body).errorMessage,
                                                        "status": "error"
                                                    });

                                                }catch (e){
                                                    $this.mainservice.setMessage({
                                                        "title": "Error " + response.status,
                                                        "text": response.statusText,
                                                        "status": "error"
                                                    });
                                                }
                                            }
                                        }catch (e){
                                            $this.mainservice.setMessage({
                                                "title": "Error ",
                                                "text": "Something went wrong!",
                                                "status": "error"
                                            });
                                        }
                                    });
                            }
                            if ($this.clipboard.action === "copy") {
                                console.log("in ctrlv copy patient", $this.target);
                                if ($this.target.modus === "patient") {
                                    let study = {
                                        "00100020": $this.target.attrs['00100020'],
                                        "00200010": {"vr": "SH", "Value": [""]},
                                        "0020000D": {"vr": "UI", "Value": [""]},
                                        "00080050": {"vr": "SH", "Value": [""]}
                                    };
                                    $this.$http.post(
                                        "../aets/" + $this.aet + "/rs/studies",
                                        study,
                                        headers
                                    ).map(res => {
                                        console.log("in map1", res);
                                        let resjson;
                                        try {
                                            resjson = res.json();
                                        } catch (e) {
                                            resjson = {};
                                        }
                                        return resjson;
                                    })
                                        .subscribe((response)=> {
                                                console.log("in subscribe2", response);
                                                _.forEach($this.clipboard.otherObjects, function (m, i) {
                                                    console.log("m", m);
                                                    console.log("i", i);
                                                    $this.$http.post(
                                                        "../aets/" + $this.aet + "/rs/studies/" + response['0020000D'].Value[0] + "/copy",
                                                        i,
                                                        headers
                                                    ).map(res => {
                                                        let resjson;
                                                        try {
                                                            resjson = res.json();
                                                        } catch (e) {
                                                            resjson = {};
                                                        }
                                                        return resjson;
                                                    })
                                                        .subscribe((response) => {
                                                            console.log("in then function", response);
                                                            $this.clipboard = {};
                                                            /*                                           $this.mainservice.setMessage({
                                                             "title": "Info",
                                                             "text": "Object with the Study Instance UID " + m.StudyInstanceUID + " copied successfully!",
                                                             "status": "info"
                                                             });*/
                                                            $this.cfpLoadingBar.stop();
                                                            // $this.callBackFree = true;
                                                        }, (response) => {
                                                            console.log("resin err", response);
                                                            $this.cfpLoadingBar.stop();
                                                            $this.mainservice.setMessage({
                                                                "title": "Error " + response.status,
                                                                "text": JSON.parse(response._body).errorMessage,
                                                                "status": "error"
                                                            });
                                                            // $this.callBackFree = true;
                                                        });
                                                });
                                                $this.fireRightQuery();
                                            },
                                            (response) => {
                                                $this.cfpLoadingBar.stop();
                                                $this.mainservice.setMessage({
                                                    "title": "Error " + response.status,
                                                    "text": JSON.parse(response._body).errorMessage,
                                                    "status": "error"
                                                });
                                                console.log("response", response);
                                            }
                                        );
                                } else {
                                    _.forEach($this.clipboard.otherObjects, function (m, i) {
                                        console.log("m", m);
                                        $this.$http.post(
                                            "../aets/" + $this.aet + "/rs/studies/" + $this.target.attrs['0020000D'].Value[0] + "/copy",
                                            m,
                                            headers
                                        ).map(res => {
                                            let resjson;
                                            try {
                                                resjson = res.json();
                                            } catch (e) {
                                                resjson = {};
                                            }
                                            return resjson;
                                        })
                                            .subscribe((response) => {
                                                console.log("in then function");
                                                $this.clipboard = {};
                                                $this.cfpLoadingBar.stop();
                                                $this.mainservice.setMessage({
                                                    "title": "Info",
                                                    "text": "Object with the Study Instance UID " + $this.target.attrs['0020000D'].Value[0] + " copied successfully!",
                                                    "status": "info"
                                                });
                                                $this.fireRightQuery();
                                                // $this.callBackFree = true;
                                            }, (response) => {
                                                $this.cfpLoadingBar.stop();
                                                $this.mainservice.setMessage({
                                                    "title": "Error " + response.status,
                                                    "text": JSON.parse(response._body).errorMessage,
                                                    "status": "error"
                                                });
                                                // $this.callBackFree = true;
                                            });
                                    });
                                }
                            }
                            if ($this.clipboard.action === "move") {
                                if ($this.target.modus === "patient") {
                                    let study = {
                                        "00100020": $this.target.attrs['00100020'],
                                        "00200010": {"vr": "SH", "Value": [""]},
                                        "0020000D": {"vr": "UI", "Value": [""]},
                                        "00080050": {"vr": "SH", "Value": [""]}
                                    };
                                    $this.$http.post(
                                        "../aets/" + $this.aet + "/rs/studies",
                                        study,
                                        headers
                                    )
                                        .map(res => {
                                            let resjson;
                                            try {
                                                resjson = res.json();
                                            } catch (e) {
                                                resjson = {};
                                            }
                                            return resjson;
                                        })
                                        .subscribe((response) => {
                                                _.forEach($this.clipboard.otherObjects, function (m, i) {
                                                    console.log("m", m);
                                                    $this.$http.post(
                                                        "../aets/" + $this.aet + "/rs/studies/" + response['0020000D'].Value[0] + "/move/" + $this.reject,
                                                        m,
                                                        headers
                                                    )
                                                        .map(res => {
                                                            let resjson;
                                                            try {
                                                                resjson = res.json();
                                                            } catch (e) {
                                                                resjson = {};
                                                            }
                                                            return resjson;
                                                        })
                                                        .subscribe(function successCallback(response) {
                                                            console.log("in then function");
                                                            $this.clipboard = {};
                                                            $this.cfpLoadingBar.stop();
                                                            $this.mainservice.setMessage({
                                                                "title": "Info",
                                                                "text": "Object with the Study Instance UID " + m.StudyInstanceUID + " moved successfully!",
                                                                "status": "info"
                                                            });
                                                            $this.fireRightQuery();
                                                        }, function errorCallback(response) {
                                                            $this.cfpLoadingBar.stop();
                                                            $this.mainservice.setMessage({
                                                                "title": "Error " + response.status,
                                                                "text": JSON.parse(response._body).errorMessage,
                                                                "status": "error"
                                                            });
                                                        });
                                                });
                                            },
                                            (response) => {
                                                $this.cfpLoadingBar.stop();
                                                $this.mainservice.setMessage({
                                                    "title": "Error " + response.status,
                                                    "text": JSON.parse(response._body).errorMessage,
                                                    "status": "error"
                                                });
                                                console.log("response", response);
                                            }
                                        );
                                } else {
                                    _.forEach($this.clipboard.otherObjects, function (m, i) {
                                        console.log("m", m);
                                        $this.$http.post(
                                            "../aets/" + $this.aet + "/rs/studies/" + $this.target.attrs['0020000D'].Value[0] + "/move/" + $this.reject,
                                            m,
                                            headers
                                        )
                                            .map(res => {
                                                let resjson;
                                                try {
                                                    resjson = res.json();
                                                } catch (e) {
                                                    resjson = {};
                                                }
                                                return resjson;
                                            })
                                            .subscribe((response) => {
                                                console.log("in then function");
                                                $this.clipboard = {};
                                                $this.cfpLoadingBar.stop();
                                                $this.mainservice.setMessage({
                                                    "title": "Info",
                                                    "text": "Object with the Study Instance UID " + $this.target.attrs['0020000D'].Value[0] + " moved successfully!",
                                                    "status": "info"
                                                });
                                                $this.fireRightQuery();
                                            }, (response) => {
                                                $this.cfpLoadingBar.stop();
                                                $this.mainservice.setMessage({
                                                    "title": "Error " + response.status,
                                                    "text": JSON.parse(response._body).errorMessage,
                                                    "status": "error"
                                                });
                                            });
                                    });
                                }
                            }

                        }
                        $this.cfpLoadingBar.stop();
                        this.dialogRef = null;
                    });
            }else {
                this.mainservice.setMessage({
                    "title": "Warning",
                    "text": "Target object can not bee in the clipboard",
                    "status":'warning'
                });
            }
        }else {
            this.mainservice.setMessage({
                "title": "Warning",
                "text": "Clipboard is empty, first add something in the clipboard with the copy,cut or merge button",
                "status":'warning'
            });
        }
    };
    renderURL(inst) {
        if (inst.video)
            return this.wadoURL(inst.wadoQueryParams, { contentType: 'video/mpeg' });
        if (inst.numberOfFrames)
            return this.wadoURL(inst.wadoQueryParams, { contentType: 'image/jpeg', frameNumber: inst.view });
        if (inst.gspsQueryParams.length)
            return this.wadoURL(inst.gspsQueryParams[inst.view - 1]);
        return this.wadoURL(inst.wadoQueryParams);
    }
    getKeys(obj){
        if(_.isArray(obj)){
            return obj;
        }else{
            // console.log("objectkeys=",Object.keys(obj));
            return Object.keys(obj);
        }
    }

    addEffect(direction){
        var element = $(".div-table");
        element.removeClass('fadeInRight').removeClass('fadeInLeft');
        setTimeout(function(){
            if(direction === "left"){
                element.addClass('animated').addClass("fadeOutRight");
            }
            if(direction === "right"){
                element.addClass('animated').addClass("fadeOutLeft");
            }
        },1);
        setTimeout(function(){
            element.removeClass('fadeOutRight').removeClass('fadeOutLeft');
            if(direction === "left"){
                element.addClass("fadeInLeft").removeClass('animated');
            }
            if(direction === "right"){
                element.addClass("fadeInRight").removeClass('animated');
            }
        },301);
    };
    wadoURL(...args: any[]):any {
        var i, url = "../aets/" + this.aet + "/wado?requestType=WADO";
        for (i = 0; i < arguments.length; i++) {
            _.forEach(arguments[i],(value, key) => {
                url += '&' + key + '=' + value;
            });
        }
        return url;
    }
    extractAttrs(attrs, tags, extracted) {
        for(let tag in attrs){
            if (this.binarySearch(tags, parseInt(tag, 16)) >= 0) {
                extracted[tag] = attrs[tag];
            }
        }
        // attrs.forEach((value, tag) => {
        //     if (this.binarySearch(tags, parseInt(tag, 16)) >= 0) {
        //         extracted[tag] = value;
        //     }
        // });
    }
    binarySearch(ar, el) {
        let m = 0;
        let n = ar.length - 1;
        while (m <= n) {
            let k = (n + m) >> 1;
            let cmp = el - ar[k];
            if (cmp > 0) {
                m = k + 1;
            } else if(cmp < 0) {
                n = k - 1;
            } else {
                return k;
            }
        }
        return -m - 1;
    }
    createGSPSQueryParams(attrs) {
        var sopClass = this.valueOf(attrs['00080016']),
            refSeries = this.valuesOf(attrs['00081115']),
            queryParams = [];
        if (sopClass === '1.2.840.10008.5.1.4.1.1.11.1' && refSeries) {
            refSeries.forEach((seriesRef) => {
                this.valuesOf(seriesRef['00081140']).forEach((objRef) => {
                    queryParams.push({
                        studyUID: attrs['0020000D'].Value[0],
                        seriesUID: seriesRef['0020000E'].Value[0],
                        objectUID: objRef['00081155'].Value[0],
                        contentType: 'image/jpeg',
                        frameNumber: this.valueOf(objRef['00081160']) || 1,
                        presentationSeriesUID: attrs['0020000E'].Value[0],
                        presentationUID: attrs['00080018'].Value[0]
                    })
                })
            })
        }
        return queryParams;
    }
    isVideo(attrs) {
        let sopClass = this.valueOf(attrs['00080016']);
        return [
            '1.2.840.10008.5.1.4.1.1.77.1.1.1',
            '1.2.840.10008.5.1.4.1.1.77.1.2.1',
            '1.2.840.10008.5.1.4.1.1.77.1.4.1']
            .indexOf(sopClass) != -1 ? 1 : 0;
    }
    valuesOf(attr) {
        return attr && attr.Value;
    }
    valueOf(attr) {
        return attr && attr.Value && attr.Value[0];
    }
    createArray(n) {
        let a = [];
        for (let i = 1; i <= n; i++)
            a.push(i);
        return a;
    }
    aesdropdown:SelectItem[] = [];
    initAETs(retries) {
        let $this = this;
       this.$http.get("../aets")
            .map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
            .subscribe(
                function (res) {
                    console.log("before call getAes",res,"this user=",$this.user);
                    $this.aes = $this.service.getAes($this.user, res);
                    console.log("aes",$this.aes);
                    // $this.aesdropdown = $this.aes;
                    $this.aes.map((ae, i)=>{
                        console.log("in map ae",ae);
                        console.log("in map i",i);
                        console.log("aesi=",$this.aes[i]);
                        $this.aesdropdown.push({label:ae.title,value:ae.title});
                        $this.aes[i]["label"] = ae.title;
                        $this.aes[i]["value"] = ae.value;

                    });
                    console.log("$this.aes after map",$this.aes);
                    $this.aet = $this.aes[0].title.toString();
                    $this.aetmodel = $this.aes[0];
                },
                function (res) {
                    if (retries)
                        this.initAETs(retries-1);
            });
    }
    onChange(newValue, model) {
        // if(model.includes(".")){
            let arr = model.split(".");
            // let obj = this;
            // for(let o of arr){
            // }
            // console.log("filter.PatientSex=",this["filter"]["PatientSex"]);
            _.set(this, arr,newValue);
            // console.log("filter.PatientSex2=",this["filter"]["PatientSex"]);
        // }else{

            // this[model] = newValue;
        // }
        if(model === "aetmodel"){
            this.aet = newValue.title;
            this.setTrash();
        }
    }
    initAttributeFilter(entity, retries) {
        let $this = this;
       this.$http.get("../attribute-filter/" + entity)
            .map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
            .subscribe(
                function (res) {
                    if(entity === "Patient" && res.dcmTag){
                        let privateAttr = [parseInt("77770010",16),parseInt("77771010", 16),parseInt("77771011", 16)];
                        res.dcmTag.push(...privateAttr);
                    }
                    $this.attributeFilters[entity] = res;
                    console.log("this.attributeFilters",$this.attributeFilters);
                },
                function (res) {
                    if (retries)
                        $this.initAttributeFilter(entity, retries-1);
            });
    };
    storageCommitmen(mode, object){
        console.log("object",object);
        this.cfpLoadingBar.start();
        let url = '../aets/'+this.aet+'/rs/studies/';
        switch(mode) {
            case "study":
                url += object.attrs["0020000D"].Value[0]+"/stgcmt";
                break;
            case "series":
                url += object.attrs["0020000D"].Value[0]+"/series/"+object.attrs["0020000E"].Value[0]+"/stgcmt";
                break;
            default:
            case "instance":
                url += object.attrs["0020000D"].Value[0]+"/series/"+object.attrs["0020000E"].Value[0]+"/instances/"+object.attrs["00080018"].Value[0]+"/stgcmt";
                break;
        }
        let $this = this;
        let headers = new Headers({ 'Content-Type': 'application/json' });
            this.$http.post(
                url,
                {},
                headers
            )
            .map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
            .subscribe(
            (response) => {
                // console.log("response",response);
                let faild = (response[0]["00081198"] && response[0]["00081198"].Value) ? response[0]["00081198"].Value.length : 0;
                let success = (response[0]["00081199"] && response[0]["00081199"].Value) ? response[0]["00081199"].Value.length : 0;
                let msgStatus = "Info";
                if(faild > 0 && success > 0){
                    msgStatus = "Warning";
                    this.mainservice.setMessage({
                        "title": msgStatus,
                        "text": faild+' of '+(success+faild)+' faild!',
                        "status": msgStatus.toLowerCase()
                    });
                    console.log(faild+' of '+(success+faild)+' faild!');
                }
                if(faild > 0 && success === 0){
                    msgStatus = "Error";
                    this.mainservice.setMessage( {
                        "title": msgStatus,
                        "text": "all "+ faild+ "faild!",
                        "status": msgStatus.toLowerCase()
                    });
                    console.log("all "+ faild+ "faild!");
                }
                if(faild === 0){
                    console.log(success+ " verified successfully, 0 faild!");
                    this.mainservice.setMessage( {
                        "title": msgStatus,
                        "text": success+ " verified successfully, 0 faild!",
                        "status": msgStatus.toLowerCase()
                    });
                }
                this.cfpLoadingBar.complete();
            },
            (response) => {
                this.mainservice.setMessage( {
                    "title": "Error "+response.status,
                    "text": JSON.parse(response._body).errorMessage,
                    "status": "error"
                });
                this.cfpLoadingBar.complete();
            }
        );
    };
    openViewer(model, mode){
        let url,
            slash,
            configuredUrl;

        switch(mode) {
            case 'patient':
                configuredUrl = this.aetmodel.dcmInvokeImageDisplayPatientURL;
                slash = (configuredUrl.substr(configuredUrl.length - 1) != '/')?'/':'';
                url = configuredUrl+slash+'IHEInvokeImageDisplay?requestType=PATIENT&patientID='+model['00100020'].Value[0];
                break;
            case 'study':
                configuredUrl = this.aetmodel.dcmInvokeImageDisplayStudyURL;
                slash = (configuredUrl.substr(configuredUrl.length - 1) != '/')?'/':'';
                url = configuredUrl+slash+'IHEInvokeImageDisplay?requestType=STUDY&studyUID='+model['0020000D'].Value[0];
                break;

        }
        console.log("url",url);
        // $window.open(url);
        this.service.getWindow().open(url);
    };
    showMoreFunction(e, elementLimit){
        let duration = 300;
        let visibleElements = $(e.target).siblings(".hiddenbuttons").length-$(e.target).siblings(".hiddenbuttons.ng-hide").length;
        console.log("visibleElements",visibleElements);
        let index = 1;
        let cssClass:string = "block"+elementLimit;
        while(index*elementLimit < visibleElements){
            index++;
        }
        let height = 26 * index;

        let variationvalue = visibleElements * 26;
        if(visibleElements > elementLimit){
            variationvalue = elementLimit * 26;
        }
        let element = $(e.target).closest(".more_menu_study");

        if(element.hasClass("open")){
            $(e.target).closest(".more_menu_content").css("height",26);
            if(visibleElements > elementLimit){
                $(e.target).closest(".more_menu_content").removeClass("block").removeClass(cssClass);
            }
            element.animate({
                right: "-="+variationvalue
            }, duration, function() {
                element.removeClass("open");
                element.removeAttr("style");
            });
        }else{
            $(e.target).closest(".more_menu_content").css("height",height);
            if(visibleElements > elementLimit){
                console.log("$(e.target).parent(.more_menu_content)",$(e.target).closest(".more_menu_content"));
                $(e.target).closest(".more_menu_content").addClass(cssClass).addClass("block");
                // $(e.target).closest(".more_menu_content").css("width",((elementLimit*26)+18));
                // $(e.target).closest(".more_menu_content").css("left",-((elementLimit-1)*26));
            }
            $(".more_menu_study.open").each(function(i,m){
                $(m).removeClass("open");

                if($(m).hasClass("repeat3block")){
                    $(m).css("right","-249px");
                }else{
                    $(m).css("right","-195px");
                }
                $(m).closest(".more_menu_content")
                    .removeClass("block")
                    .removeClass("block3")
                    .removeClass("block5")
                    .removeClass("block7")
                    .css("height",26);
                $(m).removeAttr("style");
            });
            element.animate({
                right: "+="+variationvalue
            }, duration, function() {
                element.addClass("open");

            });
        }
    };
    removeClipboardElement(modus, keys){
        this.service.removeClipboardElement(modus, keys, this.clipboard);
    }
    initExporters(retries) {
        let $this = this;
       this.$http.get("../export")
            .map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
            .subscribe(
                function (res) {
                    this.exporters = res;
                    if(res && res[0] && res[0].id){
                        $this.exporterID = res[0].id;
                    }
                },
                function (res) {
                    if (retries)
                        this.initExporters(retries-1);
                });
    }
    initRjNotes(retries) {
        let $this = this;
       this.$http.get("../reject")
            .map(res => {let resjson;try{resjson = res.json();}catch (e){resjson = {};} return resjson;})
            .subscribe(
                function (res) {
                    let rjnotes = res;
                    rjnotes.sort(function (a, b) {
                        if (a.codeValue === "113039" && a.codingSchemeDesignator === "DCM")
                            return -1;
                        if (b.codeValue === "113039" && b.codingSchemeDesignator === "DCM")
                            return 1;
                        return 0;
                    });
                    $this.rjnotes = rjnotes;
                    $this.reject = rjnotes[0].codeValue + "^" + rjnotes[0].codingSchemeDesignator;
                },
                function (res) {
                    if (retries)
                        this.initRjNotes(retries-1);
            });
    }
    showCheckBoxes(){
        this.showCheckboxes = !this.showCheckboxes;
    }

    debugTemplate(obj){
        console.log("obj",obj);
    }
}
