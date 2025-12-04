import {
  Box,
  Container,
  Heading,
  Button,
  SimpleGrid,
  useDisclosure,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react'
import { FiPlus } from 'react-icons/fi'
import { useObjectives } from './hooks'
import { ObjectiveCard } from './components/ObjectiveCard'
import { CreateObjectiveModal } from './components/CreateObjectiveModal'

function App() {
  const { data: objectives, isLoading, error } = useObjectives()
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Heading size="lg">OKR Management</Heading>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
              New Objective
            </Button>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        {isLoading && (
          <Center py={20}>
            <Spinner size="xl" color="blue.500" />
          </Center>
        )}

        {error && (
          <Center py={20}>
            <VStack spacing={4}>
              <Text color="red.500" fontSize="lg">
                Failed to load objectives
              </Text>
              <Text color="gray.600" fontSize="sm">
                {error instanceof Error ? error.message : 'Unknown error'}
              </Text>
            </VStack>
          </Center>
        )}

        {!isLoading && !error && objectives && (
          <>
            {objectives.length === 0 ? (
              <Center py={20}>
                <VStack spacing={4}>
                  <Text fontSize="lg" color="gray.600">
                    No objectives yet
                  </Text>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={onOpen}
                  >
                    Create Your First Objective
                  </Button>
                </VStack>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {objectives.map((objective) => (
                  <ObjectiveCard key={objective.id} objective={objective} />
                ))}
              </SimpleGrid>
            )}
          </>
        )}
      </Container>

      <CreateObjectiveModal isOpen={isOpen} onClose={onClose} />
    </Box>
  )
}

export default App
