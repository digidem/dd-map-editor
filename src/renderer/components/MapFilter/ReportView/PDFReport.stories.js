// @flow
import React from 'react'
import { useIntl } from 'react-intl'

import PDFReport from './PDFReport'
import { BlobProvider } from '@react-pdf/renderer'
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'
import { defaultGetPreset } from '../utils/helpers'

const exampleObservations = require('../../../../../fixtures/observations.json')

const imageBaseUrl =
  'https://images.digital-democracy.org/mapfilter-sample/sample-'
const mapStyle = 'mapbox://styles/mapbox/satellite-v10'
const mapboxAccessToken = 'pk.eyJ1IjoiZ21hY2xlbm5hbiIsImEiOiJSaWVtd2lRIn0.ASYMZE2HhwkAw4Vt7SavEg'

const getMedia = ({ id }) => ({
  src: imageBaseUrl + ((parseInt(id, 16) % 17) + 1) + '.jpg',
  type: 'image'
})

export default {
  title: 'ReportView/components/PDFReport',
  component: PDFReport,
  decorators: [
    (storyFn: any) => (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ddd',
          overflow: 'auto'
        }}>
        {storyFn()}
      </div>
    )
  ]
}

export const basic = () =>
  React.createElement(() => {
    const intl = useIntl()
    const renderer = {
      getPreset: defaultGetPreset,
      getMedia,
      intl,
      mapStyle,
      mapboxAccessToken
    }
    return (
      <BlobProvider
        document={
          <PDFReport
            length={1}
            renderer={renderer}
            observations={exampleObservations}
          />
        }>
        {({ url, loading }) =>
          loading ? (
            <h2>Loading PDF...</h2>
          ) : (
            <Document file={url}>
              <Page pageNumber={1} renderTextLayer={false} />
              <Page pageNumber={2} renderTextLayer={false} />
            </Document>
          )
        }
      </BlobProvider>
    )
  })
