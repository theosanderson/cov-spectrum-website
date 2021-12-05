import React from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { ButtonGroup, DropdownButton } from 'react-bootstrap';
import { Integration } from '../services/external-integrations/Integration';
import { PangoLineageIntegration } from '../services/external-integrations/PangoLineageIntegration';
import { OutbreakInfoIntegration } from '../services/external-integrations/OutbreakInfoIntegration';
import { WikipediaIntegration } from '../services/external-integrations/WikipediaIntegration';
import { CoVariantsIntegration } from '../services/external-integrations/CoVariantsIntegration';
import { useState } from 'react';
import { LocationDateVariantSelector } from '../data/LocationDateVariantSelector';
import { FaDownload } from 'react-icons/fa';
import { ContributorsData } from '../data/ContributorsDataset';
import { parse } from 'json2csv';
import { UsherIntegration } from '../services/external-integrations/UsherIntegration';
import { sequenceDataSource } from '../helpers/sequence-data-source';
import { SampleDetailsData } from '../data/SampleDetailsDataset';
import { serializeSampleDetailsEntryToRaw } from '../data/SampleDetailsEntry';
import { TaxoniumIntegration } from '../services/external-integrations/TaxoniumIntegration';
import { ExternalLink } from './ExternalLink';
import { getLinkToFasta } from '../data/api-lapis';
import { useAsync } from 'react-async';
import { useDeepCompareMemo } from '../helpers/deep-compare-hooks';

export interface Props {
  selector: LocationDateVariantSelector;
}

const integrations: Integration[] = [
  new WikipediaIntegration(),
  new PangoLineageIntegration(),
  new CoVariantsIntegration(),
  new OutbreakInfoIntegration(),
  new UsherIntegration(),
  new TaxoniumIntegration(),
];

export const FocusVariantHeaderControls = React.memo(
  ({ selector }: Props): JSX.Element => {
    const [showDropdown, setShowDropdown] = useState(false);
    const showDropdownFunc = (_: any) => {
      setShowDropdown(!showDropdown);
    };
    const hideDropdownFunc = (_: any) => {
      setShowDropdown(false);
    };
    const linkToFastaPromise = useDeepCompareMemo(() => getLinkToFasta(false, selector), [selector]);
    const { data: fastaLink } = useAsync({ promise: linkToFastaPromise });
    const linkToAlignedFastaPromise = useDeepCompareMemo(() => getLinkToFasta(true, selector), [selector]);
    const { data: alignedFastaLink } = useAsync({ promise: linkToAlignedFastaPromise });

    const [isDownloadingSequenceList, setIsDownloadingSequenceList] = useState(false);
    const downloadSequenceList = async () => {
      setIsDownloadingSequenceList(true);

      let csv;
      // If the open version is used, all the metadata will be downloaded. If GISAID is used, only the contributors
      // will be downloaded.
      if (sequenceDataSource === 'open') {
        const detailsDataset = await SampleDetailsData.fromApi(selector);
        csv = parse(detailsDataset.payload.map(serializeSampleDetailsEntryToRaw));
      } else {
        const contributorsDataset = await ContributorsData.fromApi(selector);
        csv = parse(contributorsDataset.payload);
      }

      // Download as file
      const element = document.createElement('a');
      const file = new Blob([csv], { type: 'text/csv' });
      element.href = URL.createObjectURL(file);
      element.download = 'sequences.csv';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setIsDownloadingSequenceList(false);
    };

    return (
      <>
        <Dropdown as={ButtonGroup} className='mr-2 mt-3' size='sm'>
          <Button variant='secondary' onClick={downloadSequenceList} disabled={isDownloadingSequenceList}>
            {!isDownloadingSequenceList ? (
              <>
                Sequence list <FaDownload className='inline-block ml-1' />
              </>
            ) : (
              <>Downloading...</>
            )}
          </Button>
          {sequenceDataSource === 'open' && (
            <>
              <Dropdown.Toggle split variant='secondary' />
              <Dropdown.Menu>
                <ExternalLink url={fastaLink ?? ''}>
                  <Dropdown.Item as={Button}>FASTA</Dropdown.Item>
                </ExternalLink>
                <ExternalLink url={alignedFastaLink ?? ''}>
                  <Dropdown.Item as={Button}>FASTA (aligned)</Dropdown.Item>
                </ExternalLink>
              </Dropdown.Menu>
            </>
          )}
        </Dropdown>
        <DropdownButton
          as={ButtonGroup}
          title='Other websites'
          variant='secondary'
          size='sm'
          className='mr-2 mt-3'
          onMouseEnter={showDropdownFunc}
          onMouseLeave={hideDropdownFunc}
          show={showDropdown}
        >
          {integrations.map(
            integration =>
              integration.isAvailable(selector) && (
                <Dropdown.Item key={integration.name} onClick={() => integration.open(selector)}>
                  {integration.name}
                </Dropdown.Item>
              )
          )}
        </DropdownButton>
      </>
    );
  }
);
