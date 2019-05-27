import React from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import DropzoneUploader from 'react-dropzone-uploader';

import 'react-dropzone-uploader/dist/styles.css';
import './styles.scss';

class DatasetForm extends React.Component {
  static propTypes = {
    editMode: PropTypes.bool,
    dataset: PropTypes.object,
    countries: PropTypes.array,
    categories: PropTypes.array,
    handleUpdate: PropTypes.func.isRequired,
    handleFormSubmit: PropTypes.func.isRequired,
    handleBackButton: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    if (this.props.editMode && this.props.dataset) {
      const countryOptions =
        this.props.countries.map(country => ({ value: country.id, label: country.name }));
      const categoryOptions =
        this.props.categories.map(category => ({ value: category[1], label: category[0] }));

      const selectedCountry =
        countryOptions.find(country => country.value === this.props.dataset.country_id);
      const selectedCategory =
        categoryOptions.find(category => category.value === this.props.dataset.category);

      let filename = null;
      if (this.props.dataset.file_data) {
        const meta = JSON.parse(this.props.dataset.file_data).metadata;
        if (meta && meta.filename) {
          filename = meta.filename;
        }
      }

      this.state = {
        name: this.props.dataset.name,
        selectedCountry,
        selectedCategory,
        filename
      };
    } else {
      this.state = {
        name: '',
        selectedCountry: null,
        selectedCategory: null,
        selectedFile: null
      };
    }

    this.handleEdit = this.handleEdit.bind(this);
  }

  handleChange = (event) => {
    const { target } = event;
    const { name } = target;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    this.setState({ [name]: value });
  };

  handleCountryChange = (selectedCountry) => {
    this.setState({ selectedCountry });
  };

  handleCategoryChange = (selectedCategory) => {
    this.setState({ selectedCategory });
  };

  handleChangeStatus = (fileWithMeta, status) => {
    if (status === 'done') {
      this.setState({ selectedFile: fileWithMeta.file, filename: null });
    } else {
      console.log(`meta: ${fileWithMeta.meta} status: ${status}`);
    }
  };

  // Build FormData object to be able to send uploaded file through multipart form
  buildFormData() {
    const formData = new FormData();
    formData.append('dataset[name]', this.state.name);
    formData.append('dataset[country_id]', this.state.selectedCountry.value);
    formData.append('dataset[category]', this.state.selectedCategory.value);

    const file = this.state.selectedFile;
    if (file) {
      formData.append('dataset[file]', file, file.name);
    }

    return formData;
  }

  handleEdit() {
    // If file was changed, need te prepare FormData object
    // and send request as 'multipart/form-data'
    if (this.state.selectedFile) {
      const formData = this.buildFormData();
      const id =  this.props.dataset.id;
      this.props.handleMultipartUpdate(formData, id);
    }
    else {
      const id = this.props.dataset.id;
      const name = this.state.name;
      const country = this.state.selectedCountry.value;
      const category = this.state.selectedCategory.value;
      const dataset = { id, name, category, country_id: country };
      this.props.handleUpdate(dataset);
    }
  }

  render() {
    const { selectedCountry, selectedCategory } = this.state;
    const countryOptions =
      this.props.countries.map(country => ({ value: country.id, label: country.name }));
    const categoryOptions =
      this.props.categories.map(category => ({ value: category[1], label: category[0] }));
    const title = this.props.editMode && this.props.dataset ? 'Edit dataset' : 'Upload dataset';
    const description = 'Check expected format of this CSV template to upload a valid file.';
    // const defaultNameValue = this.props.editMode && this.props.dataset ? this.props.dataset.name : '';
    const submitButtonTitle = this.props.editMode && this.props.dataset ? 'Save changes' : 'Done';

    return (
      <div className="dataset-form">
        <button className="action-button" onClick={this.props.handleBackButton}>Back</button>

        <h3 className="title-header">{title}</h3>
        <p className="description">{description}</p>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (this.props.editMode && this.props.dataset) {
            this.handleEdit();
          } else {
            this.props.handleFormSubmit(this.buildFormData());
          }
          e.target.reset();
        }}
        >
          <div className="input-field file-input-field">
            <label>Select CSV</label>
            <DropzoneUploader
              onChangeStatus={this.handleChangeStatus}
              accept=".csv"
              maxFiles={1}
              multiple={false}
              inputContent={this.state.filename ? this.state.filename : 'Drop file here or click to browse'}
              styles={{
                dropzone: { minHeight: 45, maxHeight: 45 },
                dropzoneActive: { borderColor: 'green' }
              }}
            />
          </div>

          <div className="input-field">
            <label>Dataset Name</label>
            <input
              type="text"
              name="name"
              value={this.state.name}
              onChange={this.handleChange}
              placeholder="Type a name"
            />
          </div>

          <div className="input-field">
            <label>Select country:</label>
            <Select
              value={selectedCountry}
              onChange={this.handleCountryChange}
              placeholder="Choose one country"
              options={countryOptions}
            />
          </div>

          <div className="input-field">
            <label>Select category</label>
            <Select
              value={selectedCategory}
              onChange={this.handleCategoryChange}
              placeholder="Choose one category"
              options={categoryOptions}
            />
          </div>

          <button className="c-button -big">{submitButtonTitle}</button>
        </form>
      </div>
    );
  }
}

export default DatasetForm;
