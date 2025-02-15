import { scale, toFixed } from 'common/math';
import { useBackend, useLocalState } from '../backend';
import { Box, Button, Divider, Flex, Icon, LabeledList, NoticeBox, ProgressBar, Section, Tabs } from '../components';
import { flow } from 'common/fp';
import { filter, sortBy } from 'common/collections';
import { NtosWindow } from '../layouts';

export const NtosNetDownloader = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    PC_device_theme,
    theme_collection = [],
    disk_size,
    disk_used,
    downloadcompletion,
    downloading,
    downloadname,
    downloadsize,
    error,
    emagged,
    categories,
    programs,
  } = data;
  const all_categories = ['All'].concat(categories);
  const downloadpercentage = toFixed(
    scale(downloadcompletion, 0, downloadsize) * 100
  );
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useLocalState(context, 'category', all_categories[0]);
  const items = flow([
    // This filters the list to only contain programs with category
    selectedCategory !== all_categories[0]
    && filter(program => program.category === selectedCategory),
    // This filters the list to only contain verified programs
    (!emagged && theme_collection.some(theme => theme.theme_file === PC_device_theme))
    && filter(program => program.verifiedsource === 1),
    // This sorts all programs in the lists by name and compatibility
    sortBy(
      program => -program.compatible,
      program => program.filedesc),
  ])(programs);
  const disk_free_space = downloading
    ? disk_size - toFixed(disk_used + downloadcompletion)
    : disk_size - disk_used;
  return (
    <NtosWindow
      theme={PC_device_theme}
      width={600}
      height={600}>
      <NtosWindow.Content>
        {!!error && (
          <NoticeBox>
            <Box mb={1}>
              {error}
            </Box>
            <Button
              content="Reset"
              onClick={() => act('PRG_reseterror')} />
          </NoticeBox>
        )}
        <Section>
          <LabeledList>
            <LabeledList.Item
              label="Hard drive"
              buttons={(!!downloading) && (
                <Button
                  icon="spinner"
                  iconSpin={1}
                  tooltipPosition="left"
                  tooltip={!!downloading && (
                    `Download: ${downloadname}.prg (${downloadpercentage}%)`
                  )} />
              ) || (!!downloadname && (
                <Button
                  color="good"
                  icon="download"
                  tooltipPosition="left"
                  tooltip={`${downloadname}.prg downloaded`} />
              ))}>
              <ProgressBar
                value={downloading ? disk_used + downloadcompletion : disk_used}
                minValue={0}
                maxValue={disk_size}>
                <Box textAlign="left">
                  {`${disk_free_space} GQ free of ${disk_size} GQ`}
                </Box>
              </ProgressBar>
            </LabeledList.Item>
          </LabeledList>
        </Section>
        <Flex height="92%">
          <Flex.Item minWidth="105px" shrink={0} basis={0}>
            <Tabs vertical>
              {all_categories.map(category => (
                <Tabs.Tab
                  key={category}
                  selected={category === selectedCategory}
                  onClick={() => setSelectedCategory(category)}>
                  {category}
                </Tabs.Tab>
              ))}
            </Tabs>
          </Flex.Item>
          <Flex.Item grow={1} basis={0} height="100%">
            <Section fill scrollable>
              {items?.map(program => (
                <Box key={program.filename}>
                  <Program
                    program={program} />
                  <Divider />
                </Box>
              ))}
            </Section>
          </Flex.Item>
        </Flex>
      </NtosWindow.Content>
    </NtosWindow>
  );
};

const Program = (props, context) => {
  const { program } = props;
  const { act, data } = useBackend(context);
  const {
    PC_device_theme,
    disk_size,
    disk_used,
    downloadcompletion,
    downloading,
    downloadname,
  } = data;
  const disk_free = disk_size - disk_used;
  return (
    <Box>
      <Flex align="baseline">
        <Flex.Item grow={1} blod>
          <Icon name={program.icon} mr={1} />
          {program.filedesc}
        </Flex.Item>
        <Flex.Item shrink={0} width="48px" textAlign="right" color="label" nowrap>
          {program.size} GQ
        </Flex.Item>
        <Flex.Item shrink={0} width="134px" textAlign="right" pr={"1rem"}>
          {(downloading && program.filename === downloadname) && (
            <ProgressBar
              width="101px"
              height="23px"
              color="good"
              minValue={0}
              maxValue={program.size}
              value={downloadcompletion} />
          ) || (
            (!program.installed
              && program.compatible
              && program.access
              && program.size < disk_free) && (
              <Button
                bold
                icon="download"
                content="Download"
                disabled={downloading}
                tooltipPosition="left"
                tooltip={!!downloading && ('Awaiting download completion...')}
                onClick={() => act('PRG_downloadfile', {
                  filename: program.filename,
                })} />
            ) || (
              <Button
                bold
                icon={program.installed ? 'check' : 'times'}
                color={
                  program.installed ? 'good'
                    : !program.compatible ? 'bad' : 'grey'
                }
                content={
                  program.installed ? 'Installed'
                    : !program.compatible ? 'Incompatible'
                      : !program.access ? 'No Access' : 'No Space'
                } />
            )
          )}
        </Flex.Item>
      </Flex>
      <Box mt={1} italic color="label">
        {program.fileinfo}
      </Box>
      {(!program.verifiedsource && PC_device_theme === "ntos") && (
        <NoticeBox mt={1} mb={0} danger fontSize="12px">
          Unverified source. Please note that Nanotrasen does not recommend
          download and usage of software from non-official servers.
        </NoticeBox>
      )}
    </Box>
  );
};
