import * as React from 'react';
import styles from './AddJsCssReference.module.scss';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ListView } from "@pnp/spfx-controls-react/lib/ListView";
import { MessageBarType, Link, Separator, CommandBarButton, IStackStyles, Text, MessageBar, PrimaryButton, DefaultButton, Dialog, DialogFooter, DialogType, Stack, IStackTokens, Icon, Spinner } from 'office-ui-fabric-react';
import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/user-custom-actions";
import "@pnp/sp/presets/all";
import {
  IUserCustomActionAddResult, IUserCustomActionUpdateResult
} from '@pnp/sp/user-custom-actions';
import { createTheme, ITheme } from 'office-ui-fabric-react/lib/Styling';
//import { mergeStyleSets } from 'office-ui-fabric-react/lib/Styling';
import { PermissionKind } from '@pnp/sp/presets/all';
//import { render } from 'react-dom';
import { getSP } from '../pnpjsConfig';
import { IJsCssItem } from '../../../models/IJsCssItem';
import { WebPartContext } from '@microsoft/sp-webpart-base';


const stackTokens: IStackTokens = { childrenGap: 40 };
const CustomActionTitle = 'JSCssAppCustomizer';
const ApplicationCustomizerComponentID = '38afa8d7-b498-4529-9f99-6279392f9309';
const description = 'This user action is of type application customizer to custom js and css file references via SFPx extension';
const theme: ITheme = createTheme({
  fonts: {
    medium: {
      // fontFamily: 'Monaco, Menlo, Consolas',
      fontSize: '18px'
    }
  }
});

const stackStyles: Partial<IStackStyles> = { root: { height: 30 } };

export interface IAddJsCssReferenceProps {
  context: WebPartContext;
}

export interface IAddJsCssReferenceState {
  disableRegisterButton: boolean;
  disableRemoveButton: boolean;
  jsfiles: IJsCssItem[];
  cssfiles: IJsCssItem[];
  currentjsRef: string;
  currentcssRef: string;
  hideJSDailog: boolean;
  hideCSSDailog: boolean;
  currentCustomAction: any;
  isEdit: boolean;
  editIndex: number;
  showMesssage: boolean;
  successmessage: string;
  userHasPermission: boolean;
  showspinner: boolean;
}



export default class AddJsCssReference extends React.Component<IAddJsCssReferenceProps, IAddJsCssReferenceState> {
  private _sp: SPFI;

  private viewFields: any[] = [
    {
      name: "Type",
      displayName: "Action",
      minWidth: 60,
      maxWidth: 60,
      render: (item, index) => {
        console.log(item);
        return (
          <React.Fragment>
            <Stack horizontal tokens={{ childrenGap: 20 }}>
              <Icon iconName="Edit" className={"ms-IconExample" + styles.customicons} onClick={() => this.editClicked(item, index)} />
              <Icon iconName="Delete" className={"ms-IconExample" + styles.customicons} onClick={() => this.deleteClicked(item, index)} />

              {/* <i className={"ms-Icon ms-Icon--Edit " + styles.customicons} onClick={()=> this.editClicked(item,index)} aria-hidden="true"></i>
            <i className={"ms-Icon ms-Icon--Delete " + styles.customicons} onClick={()=> this.deleteClicked(item,index)} aria-hidden="true"></i> */}
            </Stack>
          </React.Fragment>
        );
      },
      className: "test"
    },
    {
      name: "FilePath",
      displayName: "FilePath",
      minWidth: 600,
      render: (item, index) => {
        console.log(item);
        return (
          <React.Fragment>
            <span className={styles.filepath}>
              {item.FilePath}
            </span>
          </React.Fragment>
        );
      }
      // maxWidth:800
    }
  ];


  constructor(props: IAddJsCssReferenceProps, state: IAddJsCssReferenceProps) {
    super(props);
    this._sp = getSP();
    this.state = {
      disableRegisterButton: false,
      disableRemoveButton: false,
      jsfiles: [],
      cssfiles: [],
      currentjsRef: "",
      currentcssRef: "",
      hideJSDailog: true,
      hideCSSDailog: true,
      currentCustomAction: null,
      isEdit: false,
      editIndex: -1,
      showMesssage: false,
      successmessage: "",
      userHasPermission: false,
      showspinner: true
    };
  }

  public render(): React.ReactElement<IAddJsCssReferenceProps> {

    return (
      <React.Fragment >

        {
          this.state.showspinner &&
          <Spinner label="Please wait..." ariaLive="assertive" labelPosition="top" />
        }

        {
          this.state.userHasPermission &&
          <div className={styles.addJsCssReference}>
            <div className={styles.container}>
              <div className={styles.row}>
                <div className={styles.column}>
                  <span className={styles.title}>SPFx JS CSS References WebPart</span>
                  <p className={styles.subTitle}>This webpart can be used to add reference to custom js files and css files via SPFx extension application customizer.</p>

                </div>
                <div className={styles.row}>
                  <div className={styles.column}>
                    {this.state.showMesssage &&
                      <MessageBar dismissButtonAriaLabel="Close" onDismiss={() => { this.setState({ showMesssage: false }); }} messageBarType={MessageBarType.success}>
                        {this.state.successmessage}
                      </MessageBar>
                    }

                    {this.state.currentCustomAction && this.state.showMesssage !== true &&
                      <MessageBar >
                        We found you already have some custom js and css files references added via this customizer. Feel free to Edit or Remove references.
                      </MessageBar>
                    }


                    <div id="jsfiles">
                      <Separator />
                      <Stack horizontal styles={stackStyles} tokens={stackTokens}>
                        <Text theme={theme}>Javascript Files</Text>
                        <CommandBarButton iconProps={{ iconName: 'Add' }} text="Add JS Link" onClick={() => this.openAddJSDailog()} />
                      </Stack>
                      <Separator />
                      {/* <PrimaryButton text="Add New Item" }   /> */}

                      {this.state.jsfiles.length === 0 &&
                        <React.Fragment>
                          <MessageBar>
                            No  References Found.
                            <Link href="#" onClick={() => this.openAddJSDailog()}>
                              Click here
                            </Link>
                            <Text> to add new.</Text>
                          </MessageBar>
                          <br />
                        </React.Fragment>
                      }

                      {this.state.jsfiles.length > 0 &&
                        <ListView
                          items={this.state.jsfiles}
                          viewFields={this.viewFields}
                        />
                      }
                      <Dialog
                        minWidth={600}
                        maxWidth={900}
                        hidden={this.state.hideJSDailog}
                        onDismiss={this._closeJSDialog}
                        dialogContentProps={{
                          type: DialogType.normal,
                          title: 'Add JS Reference',
                          // subText: 'Enter a valid JS file link.'
                        }}
                        modalProps={{
                          isBlocking: false,
                          // styles: { main: { maxWidth: 450 } }
                        }}
                      >

                        <TextField required onChange={evt => this.updateJSValue(evt)} value={this.state.currentjsRef} label="URL" resizable={false} />
                        <DialogFooter>
                          <PrimaryButton onClick={() => this._addJsReference()} text="Add" />
                          <DefaultButton onClick={this._closeJSDialog} text="Cancel" />
                        </DialogFooter>
                      </Dialog>
                    </div>
                    <div id="cssfiles">
                      <br />
                      <Stack horizontal styles={stackStyles} tokens={stackTokens}>
                        <Text theme={theme}>CSS Files</Text>
                        <CommandBarButton iconProps={{ iconName: 'Add' }} text="Add CSS Link" onClick={() => this.openAddCSSDailog()} />
                      </Stack>
                      {/* <PrimaryButton text="Add New Item" onClick={()=>this.openAddCSSDailog()}  /> */}
                      <Separator />
                      {this.state.cssfiles.length === 0 &&
                        <>
                          <MessageBar>
                            No  References Found.
                            <Link href="#" onClick={() => this.openAddCSSDailog()}>
                              Click here
                            </Link>
                            <Text> to add new.</Text>
                          </MessageBar>
                          <br />
                        </>
                      }
                      {this.state.cssfiles.length > 0 &&

                        <ListView
                          items={this.state.cssfiles}
                          viewFields={this.viewFields}
                        // iconFieldName="ServerRelativeUrl"

                        // selectionMode={SelectionMode.multiple}
                        // selection={this._getSelection}

                        />
                      }
                      <Dialog
                        minWidth={600}
                        maxWidth={900}
                        hidden={this.state.hideCSSDailog}
                        onDismiss={this._closeCSSDialog}
                        dialogContentProps={{
                          type: DialogType.normal,
                          title: 'Add CSS Reference',
                          // subText: 'Enter a valid CSS file link.'
                        }}
                        modalProps={{
                          isBlocking: false,
                          // styles: { main: { minWidth: 500 !important ,width:500} }
                        }}
                      >

                        <TextField required onChange={evt => this.updateCSSValue(evt)} value={this.state.currentcssRef} label="URL" />
                        <DialogFooter>
                          <PrimaryButton onClick={() => this._addCSSReference()} text="Add" />
                          <DefaultButton onClick={this._closeCSSDialog} text="Cancel" />
                        </DialogFooter>
                      </Dialog>

                    </div>

                    <br />
                    <Stack horizontal tokens={stackTokens}>
                      <PrimaryButton text="Activate" onClick={() => this._registerClicked()} disabled={(this.state.jsfiles.length > 0 || this.state.cssfiles.length > 0) ? false : true} />
                      <DefaultButton text="Deactivate" onClick={() => this._removeClicked()} disabled={this.state.currentCustomAction === null ? true : false} />
                    </Stack>

                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        {
          !this.state.userHasPermission && !this.state.showspinner &&
          <MessageBar messageBarType={MessageBarType.severeWarning}>
            Access denied, you do not have permission to access this section. Please connect with your site admins.
          </MessageBar>
        }

      </React.Fragment >
    );
  }

  public componentDidMount() {
    void this.checkPermisson();
  }

  private async checkPermisson() {
    const perms2 = await this._sp.web.currentUserHasPermissions(PermissionKind.ManageWeb);
    console.log(perms2);
    this.setState({
      userHasPermission: perms2,
      showspinner: false
    });
    if (perms2) {
      void this.getCustomAction();
    }
  }


  private async _registerClicked() {
    await this.setCustomAction();
  }

  private _removeClicked(): void {
    const uca = this._sp.web.userCustomActions.getById(this.state.currentCustomAction.Id);
    const response = uca.delete();
    console.log("removed custom action");
    console.log(response);
    this.setState({
      currentCustomAction: null, jsfiles: [], cssfiles: [],
      showMesssage: true, successmessage: "Application Customizer deactivated sucessfully."
    });
  }

  private updateJSValue(evt): void {
    this.setState({
      currentjsRef: evt.target.value
    });
  }

  private updateCSSValue(evt): void {
    this.setState({
      currentcssRef: evt.target.value
    });
  }

  private editClicked(item: IJsCssItem, index: number): void {

    if (item.Type === "js") {
      this.setState({
        hideJSDailog: false,
        currentjsRef: item.FilePath,
        isEdit: true,
        editIndex: index
      });
    }

    if (item.Type === "css") {
      this.setState({
        hideCSSDailog: false,
        currentcssRef: item.FilePath,
        isEdit: true,
        editIndex: index
      });
    }
  }

  private deleteClicked(item: IJsCssItem, index: number): void {
    if (item.Type === "css") {
      const currentitems = this.state.cssfiles.map((x) => x);
      currentitems.splice(index, 1);
      this.setState({ cssfiles: currentitems });
    }
    else if (item.Type === "js") {
      const currentitems = this.state.jsfiles.map((x) => x);
      currentitems.splice(index, 1);
      this.setState({ jsfiles: currentitems });
    }
  }

  private openAddJSDailog() {
    this.setState({ hideJSDailog: false });
  }

  private openAddCSSDailog() {
    this.setState({ hideCSSDailog: false });
  }

  private _addJsReference() {
    if (!this.state.isEdit) {
      const item: IJsCssItem = {
        FilePath: this.state.currentjsRef,
        Type: "js"
      };

      const currentitems: IJsCssItem[] = this.state.jsfiles.map((x) => x);
      currentitems.push(item);
      currentitems[this.state.jsfiles.length] = item;
      this.setState({
        jsfiles: currentitems,
        hideJSDailog: true, currentjsRef: ""
      });
    }
    else {
      const item: IJsCssItem = {
        FilePath: this.state.currentjsRef,
        Type: "js"
      };
      const currentitems: IJsCssItem[] = this.state.jsfiles.map((x) => x);
      currentitems[this.state.editIndex] = item;
      this.setState({
        jsfiles: currentitems,
        hideJSDailog: true, currentjsRef: "",
        isEdit: false, editIndex: -1
      });
    }
  }

  private _addCSSReference() {
    if (!this.state.isEdit) {
      console.log("add item to grid");
      const item = {
        FilePath: this.state.currentcssRef,
        Type: "css"
      };

      const currentitems: IJsCssItem[] = this.state.cssfiles.map((x) => x);
      currentitems.push(item);
      currentitems[this.state.cssfiles.length] = item;
      this.setState({
        cssfiles: currentitems,
        hideCSSDailog: true,
        currentcssRef: ""
      });
    }
    else {
      console.log("add item to grid");
      const item: IJsCssItem = {
        FilePath: this.state.currentcssRef,
        Type: "css"
      };

      const currentitems: IJsCssItem[] = this.state.cssfiles.map((x) => x);

      currentitems[this.state.editIndex] = item;
      this.setState({
        cssfiles: currentitems,
        hideCSSDailog: true,
        currentcssRef: "",
        editIndex: -1, isEdit: false
      });
    }
  }

  private _closeJSDialog = (): void => {
    this.setState({ hideJSDailog: true });
  }
  private _closeCSSDialog = (): void => {
    this.setState({ hideCSSDailog: true });
  }

  private async getCustomAction(): Promise<void> {
    const customactions: any = await this._sp.web.userCustomActions();
    console.log(customactions);
    const found = customactions.filter(item => item.Title === CustomActionTitle);
    if (found.length > 0) {
      this.setState({ currentCustomAction: found[0] });
      const jsonproperties = found[0].ClientSideComponentProperties;

      const jsfileArray = JSON.parse(jsonproperties).jsfiles;
      const cssfileArray = JSON.parse(jsonproperties).cssfiles;

      console.log(jsfileArray);
      console.log(cssfileArray);
      this.setState({ jsfiles: jsfileArray, cssfiles: cssfileArray });
    }
  }

  protected async setCustomAction(): Promise<void> {
    try {
      const payload: object = {
        "Title": CustomActionTitle,
        "Description": description,
        "Location": 'ClientSideExtension.ApplicationCustomizer',
        ClientSideComponentId: ApplicationCustomizerComponentID,
        ClientSideComponentProperties: JSON.stringify({ jsfiles: this.state.jsfiles, cssfiles: this.state.cssfiles }),
      };

      if (this.state.currentCustomAction === null) {
        const response: IUserCustomActionAddResult = await this._sp.web.userCustomActions.add(payload);
        console.log(response);
        const uca = await this._sp.web.userCustomActions.getById(response.data.Id);
        this.setState({ currentCustomAction: uca, showMesssage: true, successmessage: "Application customizer activated sucessfully." });
      }
      else {
        const uca = this._sp.web.userCustomActions.getById(this.state.currentCustomAction.Id);
        const response: IUserCustomActionUpdateResult = await uca.update(payload);
        const ucaupdated = await this._sp.web.userCustomActions.getById(response.data.Id);
        this.setState({ currentCustomAction: ucaupdated, showMesssage: true, successmessage: "Application customizer updated sucessfully." });
      }
    } catch (error) {
      console.error(error);
    }
  }
}
