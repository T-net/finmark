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

  isValidForm() {
    const { name, selectedCountry, selectedCategory, selectedFile } = this.state;

    return (name.length > 0 && selectedCountry !== null && selectedCategory !== null && selectedFile !== null);
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
    } else if (status === 'removed') {
      this.setState({ selectedFile: null });
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
    const title = this.props.editMode && this.props.dataset ? 'Edit GIS dataset' : 'Upload GIS dataset';
    const submitButtonTitle = this.props.editMode && this.props.dataset ? 'Save changes' : 'Done';

    return (
      <div className="dataset-form">
        <button className="action-button" onClick={this.props.handleBackButton}>Back</button>

        <h3 className="title-header">{title}</h3>
        <p className="description">
          Check the expected format of this <a href="/csv_template.csv" target="_blank" download>CSV template</a> to upload a valid file.
        </p>
        <p className="description -small">
          After approval, it will be shown on country page.
        </p>
        <p className="description -small">
          Once submitted, we will be notified of your submission, we will go through your data,
          approve or return it to you for further changes.<br />
          For further information on your data, please contact <a href="mailto:info@finmark.org.za">info@finmark.org.za</a>.
        </p>

        <form onSubmit={(e) => {
          e.preventDefault();

          if (this.isValidForm()) {
            if (this.props.editMode && this.props.dataset) {
              this.handleEdit();
            } else {
              this.props.handleFormSubmit(this.buildFormData());
            }
            e.target.reset();
          }
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
                dropzone: { minHeight: 45, maxHeight: 45, border: 0, borderRadius: 0, backgroundColor: 'rgba(47, 147, 156, .1)' },
                inputLabel: { color: '#001D22', fontSize: 16, fontFamily: 'Open Sans', fontWeight: 300, textTransform: 'none' },
                dropzoneActive: { borderColor: 'green' },
                preview: {
                  minHeight: 41,
                  maxHeight: 41,
                  padding: 10,
                  borderBottom: 0,
                  color: '#001D22',
                  fontSize: 16,
                  fontFamily: 'Open Sans',
                  fontWeight: 300,
                  textTransform: 'none'
                }
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

          <button className="c-button -big" disabled={!this.isValidForm()}>{submitButtonTitle}</button>
        </form>
      </div>
    );
  }
}

export default DatasetForm;
